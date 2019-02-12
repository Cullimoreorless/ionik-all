export class GraphFilters {
  startDate:string
  endDate:string
  threshold:number
  constructor(){
    let now = new Date();
    this.startDate = '7/1/2018';
    this.endDate = now.toLocaleDateString();
    this.threshold = 10;}
}
