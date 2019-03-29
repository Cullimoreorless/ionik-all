import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'
import { AuthService } from '@/services/auth-service.service';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password:['', Validators.required]
  })

  constructor(private fb : FormBuilder, private auth: AuthService) { 
    
  }

  ngOnInit() {
  }

  login(){
    let creds = this.form.value;

    if(creds.username && creds.password){
      this.auth.login(creds).subscribe((authRes)=>{
        console.log(authRes)
      });
    }
  }

}
