<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::create([
            'full_name' => 'Admin User',
            'email' => 'admin@sheltrify.com',
            'password' => Hash::make('password123'),
            'phone' => '+2348000000001',
            'role' => 'ADMIN',
            'is_verified' => true,
            'is_premium' => true,
            'avatar_url' => 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256',
        ]);
        
        // Create wallet for admin
        Wallet::create([
            'user_id' => $admin->id,
            'swc_balance' => 1000000,
            'credibility_score' => 100,
            'tier' => 'platinum',
            'referrals' => 50,
        ]);

        // Create landlord user
        $landlord = User::create([
            'full_name' => 'Landlord Baba',
            'email' => 'landlord@sheltrify.com',
            'password' => Hash::make('password123'),
            'phone' => '+2348000000002',
            'role' => 'LANDLORD',
            'is_verified' => true,
            'is_premium' => true,
            'avatar_url' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256',
        ]);
        
        Wallet::create([
            'user_id' => $landlord->id,
            'swc_balance' => 500000,
            'credibility_score' => 85,
            'tier' => 'gold',
            'referrals' => 10,
        ]);

        // Create agent user
        $agent = User::create([
            'full_name' => 'Agent Smith',
            'email' => 'agent@sheltrify.com',
            'password' => Hash::make('password123'),
            'phone' => '+2348000000003',
            'role' => 'AGENT',
            'is_verified' => true,
            'is_premium' => true,
            'avatar_url' => 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256',
        ]);
        
        Wallet::create([
            'user_id' => $agent->id,
            'swc_balance' => 300000,
            'credibility_score' => 75,
            'tier' => 'gold',
            'referrals' => 5,
        ]);

        // Create seeker/tenant user
        $seeker = User::create([
            'full_name' => 'Tenant Seeker',
            'email' => 'seeker@sheltrify.com',
            'password' => Hash::make('password123'),
            'phone' => '+2348000000004',
            'role' => 'SEEKER',
            'is_verified' => true,
            'is_premium' => false,
            'avatar_url' => 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256',
        ]);
        
        Wallet::create([
            'user_id' => $seeker->id,
            'swc_balance' => 50000,
            'credibility_score' => 50,
            'tier' => 'bronze',
            'referrals' => 0,
        ]);

        // Create referrer user
        $referrer = User::create([
            'full_name' => 'Referrer Extraordinaire',
            'email' => 'referrer@sheltrify.com',
            'password' => Hash::make('password123'),
            'phone' => '+2348000000005',
            'role' => 'REFERRER',
            'is_verified' => true,
            'is_premium' => true,
            'avatar_url' => 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=256',
        ]);
        
        Wallet::create([
            'user_id' => $referrer->id,
            'swc_balance' => 200000,
            'credibility_score' => 80,
            'tier' => 'gold',
            'referrals' => 20,
        ]);

        // Create investor user
        $investor = User::create([
            'full_name' => 'Big Investor',
            'email' => 'investor@sheltrify.com',
            'password' => Hash::make('password123'),
            'phone' => '+2348000000006',
            'role' => 'INVESTOR',
            'is_verified' => true,
            'is_premium' => true,
            'avatar_url' => 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256',
        ]);
        
        Wallet::create([
            'user_id' => $investor->id,
            'swc_balance' => 5000000,
            'credibility_score' => 100,
            'tier' => 'platinum',
            'referrals' => 100,
        ]);

        // Create artisan users
        $artisans = [
            [
                'full_name' => 'Master Plumber Ahmed',
                'email' => 'plumber@sheltrify.com',
                'phone' => '+2348000000007',
                'artisan_service' => 'PLUMBER',
                'artisan_location' => 'Lagos, Ikeja',
                'artisan_bio' => 'Expert plumber with 15 years experience in residential and commercial plumbing.',
                'artisan_rating' => 4.8,
            ],
            [
                'full_name' => 'Electrician Joe',
                'email' => 'electrician@sheltrify.com',
                'phone' => '+2348000000008',
                'artisan_service' => 'ELECTRICIAN',
                'artisan_location' => 'Abuja, Gwagwalada',
                'artisan_bio' => 'Certified electrician specializing in home wiring and repairs.',
                'artisan_rating' => 4.6,
            ],
            [
                'full_name' => 'Painter Moses',
                'email' => 'painter@sheltrify.com',
                'phone' => '+2348000000009',
                'artisan_service' => 'PAINTER',
                'artisan_location' => 'Lagos, Surulere',
                'artisan_bio' => 'Professional painter with expertise in interior and exterior decoration.',
                'artisan_rating' => 4.5,
            ],
            [
                'full_name' => 'Carpenter Chidi',
                'email' => 'carpenter@sheltrify.com',
                'phone' => '+2348000000010',
                'artisan_service' => 'CARPENTER',
                'artisan_location' => 'Port Harcourt',
                'artisan_bio' => 'Master carpenter for furniture making and wood repairs.',
                'artisan_rating' => 4.7,
            ],
            [
                'full_name' => 'Mechanic Emeka',
                'email' => 'mechanic@sheltrify.com',
                'phone' => '+2348000000011',
                'artisan_service' => 'MECHANIC',
                'artisan_location' => 'Ibadan',
                'artisan_bio' => 'Experienced mechanic for all vehicle types.',
                'artisan_rating' => 4.4,
            ],
        ];

        foreach ($artisans as $artisanData) {
            $artisan = User::create([
                'full_name' => $artisanData['full_name'],
                'email' => $artisanData['email'],
                'password' => Hash::make('password123'),
                'phone' => $artisanData['phone'],
                'role' => 'ARTISAN',
                'is_verified' => true,
                'is_premium' => false,
                'avatar_url' => 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=256',
                'artisan_service' => $artisanData['artisan_service'],
                'artisan_location' => $artisanData['artisan_location'],
                'artisan_bio' => $artisanData['artisan_bio'],
                'artisan_rating' => $artisanData['artisan_rating'],
            ]);
            
            Wallet::create([
                'user_id' => $artisan->id,
                'swc_balance' => 10000,
                'credibility_score' => 60,
                'tier' => 'bronze',
                'referrals' => 0,
            ]);
        }

        echo "\n✅ Users seeded successfully!\n";
        echo "\n📋 Login Credentials:\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "Email                    | Password     | Role\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "admin@sheltrify.com     | password123  | ADMIN\n";
        echo "landlord@sheltrify.com  | password123  | LANDLORD\n";
        echo "agent@sheltrify.com     | password123  | AGENT (CC/Agent)\n";
        echo "seeker@sheltrify.com    | password123  | SEEKER (Tenant)\n";
        echo "referrer@sheltrify.com  | password123  | REFERRER\n";
        echo "investor@sheltrify.com  | password123  | INVESTOR\n";
        echo "plumber@sheltrify.com   | password123  | ARTISAN (Plumber)\n";
        echo "electrician@sheltrify.com| password123  | ARTISAN (Electrician)\n";
        echo "painter@sheltrify.com   | password123  | ARTISAN (Painter)\n";
        echo "carpenter@sheltrify.com | password123  | ARTISAN (Carpenter)\n";
        echo "mechanic@sheltrify.com  | password123  | ARTISAN (Mechanic)\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    }
}
