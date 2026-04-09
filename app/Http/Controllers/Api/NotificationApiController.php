<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationApiController extends Controller
{
    /**
     * List the authenticated user's notifications (paginated, newest first).
     */
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        $unreadCount = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return $this->jsonOk([
            'notifications' => $notifications->items(),
            'unread_count'  => $unreadCount,
            'pagination'    => [
                'total'        => $notifications->total(),
                'current_page' => $notifications->currentPage(),
                'last_page'    => $notifications->lastPage(),
            ],
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(Request $request, int $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notification->update(['read_at' => now()]);

        return $this->jsonOk(['notification' => $notification]);
    }

    /**
     * Mark ALL unread notifications as read.
     */
    public function markAllRead(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->jsonOk(['marked_count' => $count]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, int $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $notification->delete();

        return $this->jsonOk(['message' => 'Notification deleted.']);
    }

    /**
     * Get unread count only (lightweight poll endpoint).
     */
    public function unreadCount(Request $request)
    {
        $count = Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return $this->jsonOk(['unread_count' => $count]);
    }
}
