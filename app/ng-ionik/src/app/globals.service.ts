import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalsService {
  coolDark:string = '#009FB7';
  coolLight:string = '#E5E5E5';
  warmLight:string = '#EEAA7B';
  warmDark:string = '#E37222';
  totalContrast:string='#FE4A49';
  constructor() { }
}
