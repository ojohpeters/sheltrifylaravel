<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Investment;
use App\Models\InvestmentOpportunity;
use App\Models\Wallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvestmentApiController extends Controller
{
    public function opportunities()
    {
        $rows = InvestmentOpportunity::query()->whereIn('status', ['Open', 'Coming Soon'])
            ->withCount('investments')->orderByDesc('created_at')->get();

        return $this->jsonOk($rows);
    }

    public function opportunityShow(string $id)
    {
        $o = InvestmentOpportunity::query()->withCount('investments')->find($id);
        if (! $o) {
            return $this->jsonErr('Investment opportunity not found', 404);
        }

        return $this->jsonOk($o);
    }

    public function invest(Request $request)
    {
        $data = $request->validate([
            'opportunityId' => 'required|string',
            'amount' => 'required|numeric|min:1',
        ]);
        $user = $request->user();
        if ($user->role !== 'INVESTOR') {
            return $this->jsonErr('Only investors can make investments', 403);
        }
        $opp = InvestmentOpportunity::query()->find($data['opportunityId']);
        if (! $opp) {
            return $this->jsonErr('Investment opportunity not found', 404);
        }
        if ($opp->status !== 'Open') {
            return $this->jsonErr('This investment opportunity is not open for investment', 400);
        }
        if ($data['amount'] < $opp->min_investment) {
            return $this->jsonErr('Minimum investment is ₦'.number_format($opp->min_investment), 400);
        }
        if ($opp->max_investment && $data['amount'] > $opp->max_investment) {
            return $this->jsonErr('Maximum investment is ₦'.number_format($opp->max_investment), 400);
        }
        $wallet = Wallet::query()->firstOrCreate(['user_id' => $user->id], ['swc_balance' => 0, 'tier' => 'bronze']);
        $swcRequired = $data['amount'] / 90;
        if ($wallet->swc_balance < $swcRequired) {
            return $this->jsonErr('Insufficient balance. You need '.number_format($swcRequired, 2).' SWC (₦'.number_format($data['amount']).') to invest', 400);
        }

        return DB::transaction(function () use ($user, $opp, $data, $wallet, $swcRequired) {
            $inv = Investment::create([
                'user_id' => $user->id,
                'opportunity_id' => $opp->id,
                'amount' => $data['amount'],
                'roi_percentage' => $opp->expected_roi,
            ]);
            $wallet->decrement('swc_balance', $swcRequired);
            $opp->increment('total_raised', $data['amount']);
            $inv->load(['opportunity', 'user:id,full_name,email']);

            return $this->jsonOk([
                'investment' => $inv,
                'newBalance' => $wallet->fresh()->swc_balance,
            ], 'Investment created successfully', 201);
        });
    }

    public function myInvestments(Request $request)
    {
        $rows = Investment::query()->where('user_id', $request->user()->id)
            ->with('opportunity')->orderByDesc('created_at')->get();

        return $this->jsonOk($rows);
    }

    public function stats(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'INVESTOR') {
            return $this->jsonErr('Only investors can view investment stats', 403);
        }
        $investments = Investment::query()->where('user_id', $user->id)->where('status', 'active')->with('opportunity')->get();
        $totalCapital = $investments->sum('amount');
        $totalProfit = $investments->sum('profit_earned');
        $activeProps = $investments->pluck('opportunity_id')->unique()->count();
        $avgRoi = $investments->count() ? $investments->avg('roi_percentage') : 0;
        $monthly = $totalCapital * ($avgRoi / 100) / 12;

        return $this->jsonOk([
            'totalInvestmentCapital' => $totalCapital,
            'totalProfitGenerated' => $totalProfit,
            'monthlyRentalReturns' => $monthly,
            'activePropertiesInvestedIn' => $activeProps,
            'projectedAnnualROI' => $avgRoi,
            'investments' => $investments->count(),
        ]);
    }
}
