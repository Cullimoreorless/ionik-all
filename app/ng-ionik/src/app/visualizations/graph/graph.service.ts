import { Injectable } from '@angular/core';
import { Node } from './node';
import { Link } from './link';
import { GraphSimulation } from './graph-simulation';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  constructor(private http: HttpClient) { }

  getForceGraph(nodes:Node[],links:Link[], options:{width,height}){
    let graph = new GraphSimulation(nodes, links, options);
    return graph;
  }

  getGraphData(params)  {
    return this.http.get('/api/molecule/getGraphData',{
      params:params
    });
  }
}
