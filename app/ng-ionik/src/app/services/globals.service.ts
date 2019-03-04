import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalsService {
  coolDark:string = '#006E90';
  coolLight:string = '#41BBD9';
  warmLight:string = '#ADCAD6';
  warmDark:string = '#F18F01';
  totalContrast:string='#FE4A49';
  constructor() { }
}
