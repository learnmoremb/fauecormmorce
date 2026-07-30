import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer class="bg-amazon-dark text-white mt-16">
      <div class="max-w-screen-xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h4 class="font-bold mb-3 text-amazon-yellow">Get to Know Us</h4>
          <ul class="space-y-2 text-gray-300">
            <li><a href="#" class="hover:underline">About ShopZone</a></li>
            <li><a href="#" class="hover:underline">Careers</a></li>
            <li><a href="#" class="hover:underline">Press Releases</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold mb-3 text-amazon-yellow">Make Money With Us</h4>
          <ul class="space-y-2 text-gray-300">
            <li><a routerLink="/auth/register-shop" class="hover:underline">Sell on ShopZone</a></li>
            <li><a href="#" class="hover:underline">Become an Affiliate</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold mb-3 text-amazon-yellow">Let Us Help You</h4>
          <ul class="space-y-2 text-gray-300">
            <li><a routerLink="/orders" class="hover:underline">Your Orders</a></li>
            <li><a href="#" class="hover:underline">Returns & Replacements</a></li>
            <li><a href="#" class="hover:underline">Help</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold mb-3 text-amazon-yellow">ShopZone</h4>
          <p class="text-gray-300">Your one-stop shop for everything. Connecting buyers with sellers worldwide.</p>
        </div>
      </div>
      <div class="border-t border-gray-700 py-4 text-center text-gray-400 text-xs">
        © {{ year }} ShopZone. All rights reserved.
      </div>
    </footer>
  `,
})
export class FooterComponent {
  year = new Date().getFullYear();
}
