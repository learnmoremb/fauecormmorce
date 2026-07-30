import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { CartService } from './core/services/cart.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <app-navbar/>
    <main class="min-h-screen">
      <router-outlet/>
    </main>
    <app-footer/>
  `,
})
export class AppComponent implements OnInit {
  private auth = inject(AuthService);
  private cart = inject(CartService);

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.cart.loadCart();
    }
  }
}
