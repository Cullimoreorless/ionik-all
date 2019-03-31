import { Component } from '@angular/core';
import { AuthService } from './services/auth-service.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  {
  title = 'Siamo Data';
  isLoggedIn: boolean;

  constructor(private auth: AuthService,
           private router : Router){
    this.router.events.subscribe((event) => {
      if(event instanceof NavigationEnd){
        this.isLoggedIn = this.auth.isLoggedIn();
      }
    });
  }
  
  logout(){
    this.auth.logout();
  }

}
