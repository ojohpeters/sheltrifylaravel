<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Records when each signed-in user was last active.
 *
 * `users.last_seen_at` existed but nothing ever wrote to it, so "who was active
 * today" was unanswerable. Writing on every request would add a row-level write
 * to every page view, so the column is only refreshed once it has gone stale.
 */
class TrackLastSeen
{
    /** How long a recorded timestamp is considered fresh enough to leave alone. */
    private const STALE_AFTER_MINUTES = 5;

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $last = $user->last_seen_at;

            if (! $last || $last->lt(now()->subMinutes(self::STALE_AFTER_MINUTES))) {
                // A bare UPDATE rather than $user->save(): this must not touch
                // updated_at, fire model events, or race with whatever else the
                // request is doing to the user record.
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['last_seen_at' => now()]);

                $user->last_seen_at = now();
            }
        }

        return $next($request);
    }
}
