import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.css']
})
export class CompanyComponent implements OnInit {

  //lowercase used for crud to allow for easy insertion/retreival
  form: FormGroup = this.fb.group({
    companyid:[''],
    companycode:[''],
    companyname:['']
  });

  constructor(
    private fb: FormBuilder, 
    private http: HttpClient,
    private route: ActivatedRoute) { }

  ngOnInit() { 
    this.http.get(`/api/company/getCompany`)
      .subscribe(next => this.form.setValue(next));
    // this.form.setValue({companyid:0, companycode:'',companyname:''})
  }

  saveCompany(){
    console.log(this.form.value)
    let x =  this.http.post("/api/company/saveCompany", this.form.value);
    x.subscribe((next) => {
      this.form.setValue(next);
    })
  }

}
