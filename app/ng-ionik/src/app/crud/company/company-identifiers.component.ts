import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, ParamMap} from '@angular/router';
import { ComponentFactoryResolver } from '@angular/core/src/render3';

@Component({
  selector: 'company-identifiers',
  templateUrl: './company-identifiers.component.html',
  styleUrls: ['./company-identifiers.component.css']
})
export class CompanyIdentifiersComponent implements OnInit {
  companyId : number;
  form: FormGroup = this.fb.group({
    integrations: this.fb.array([])
  });
  systemTypes: any;
  errorMessage:string = "";

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.http.get('/api/system/types')
      .subscribe((next) => {
        this.systemTypes= next;
      });
    this.http.get(`/api/company/companyIntegrations`)
      .subscribe((integrations : Array<any>) => {
        if(integrations && integrations.length > 0){
          for(let integration of integrations){
            this.addIntegration();
          }
          this.form.setValue({
            integrations: integrations
          });
        }
        else{
          this.addIntegration();
        }
      });
  }

  addIntegration():void {
    let newIntegration = this.createIntegration();
    this.integrations.push(newIntegration);
  }

  createIntegration(): FormGroup{
    return this.fb.group({
      companyintegrationid:[''],
      companyid:[''],
      systemtypeid:[''],
      integrationidentifier:['']
    });
  }

  removeIntegration(i:number):void{
    if(this.integrations.controls[i].controls.companyintegrationid
         && this.integrations.controls[i].controls.companyintegrationid.value){
      this.http.get(`/api/company/removeCompanyIntegration/${this.integrations.controls[i].controls.companyintegrationid.value}`)
        .subscribe((response : any) =>{
          if(response.success){
            this.integrations.controls.splice(i,1);
          }
          else{
            this.errorMessage = "Could not remove integration, please try again"
          }
        })
    }
    else{
      this.integrations.controls.splice(i,1);
    }
  }

  saveCompanyIntegrations(){
    console.log( this.integrations);
    console.log(this.form.value);
    this.integrations.controls.forEach((element : any) => {
      console.log(element);
      element.controls.companyid.setValue(this.companyId)
    });
    this.http.post('/api/company/saveCompanyIntegrations', 
      this.form.value).subscribe((next) => {
        console.log(next);
        this.form.setValue({integrations: next})
      });
  }

  get integrations() {
    return this.form.get('integrations') as FormArray;
  }

}
