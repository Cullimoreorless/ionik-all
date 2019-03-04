import * as d3 from 'd3';

export class Node implements d3.SimulationNodeDatum{
  x : number
  y : number
  name : string
  id : number
  location: string
  department: string
  normalizedweight: number
  index?:number
  constructor(id:number){
    this.id = id;
  }

}
