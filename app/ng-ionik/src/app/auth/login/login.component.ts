import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { AuthService } from '@/services/auth-service.service';
import { Router } from '@angular/router';
import { ThrowStmt } from '@angular/compiler';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password:['', Validators.required]
  });
  errorMessage:string = "";

  constructor(private fb : FormBuilder, 
        private auth: AuthService,
        private router: Router) { 
    
  }

  ngOnInit() {
  }

  login(){
    this.errorMessage = "";
    let creds = this.form.value;

    if(creds.username && creds.password){
      this.auth.login(creds).subscribe((authRes : any)=>{
        if(authRes.success){
          this.router.navigate(['/network']);
        }
        else{
          this.errorMessage = authRes.message;
        }
      });
    }
  }

}
