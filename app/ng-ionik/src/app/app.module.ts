import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS} from '@angular/common/http'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { GraphComponent } from  './visualizations/graph/graph.component';
import { GlobalsService } from './services/globals.service';
import { SlidingMenuComponent } from './common/sliding-menu/sliding-menu.component';
import { LoginComponent } from './auth/login/login.component';
import { Routes, RouterModule } from '@angular/router';
import { RegisterUserComponent } from './auth/register-user/register-user.component';
import { CompanyIdentifiersComponent } from './crud/company/company-identifiers.component';
import { CompanyComponent } from './crud/company/company.component';
import { PersonIdentifiersComponent } from './crud/person/person-identifiers.component';


import { AuthService } from './services/auth-service.service';
import { AuthInterceptor } from './services/auth.interceptor';
import { AuthGuard } from './services/auth.guard';

const routes : Routes = [
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterUserComponent },
  { path: "company", component: CompanyComponent, canActivate: [AuthGuard]},
  { path: "person", component: PersonIdentifiersComponent, canActivate: [AuthGuard]},
  { path: "companyIntegration", component: CompanyIdentifiersComponent, canActivate: [AuthGuard]},
  { path: "network", component: GraphComponent, canActivate: [AuthGuard] },
  { path: '',
    redirectTo: '/network',
    pathMatch: 'full'
  }
]

@NgModule({
  declarations: [
    AppComponent,
    GraphComponent,
    SlidingMenuComponent,
    LoginComponent,
    RegisterUserComponent,
    CompanyIdentifiersComponent,
    CompanyComponent,
    PersonIdentifiersComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(
      routes, { enableTracing: true }
    )
  ],
  providers: [
    GlobalsService,
    AuthService,
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi:true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
