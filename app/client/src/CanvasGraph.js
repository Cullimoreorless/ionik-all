import React, {Component} from 'react';
const d3 = require('d3');

class CanvasGraph extends Component{
  width = 960;
  height = 500;
  
  constructor(props){
    super(props);
    this.width = 960;
    this.height = 500;
  }

  componentDidMount(){
    this.getDataFromDB();
  }

  getDataFromDB(){
    fetch("/molecule/getGraphData")
      .then(data => data.json())
      .then(res =>{
        let simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.id; }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(this.width / 2, this.height / 2));
      
        const canvas = d3.select(this.node);
        let ctx = canvas.node().getContext('2d')
        canvas.attr("width",this.width)
          .attr("height",this.height);
        
        let links = res.links;
        let preNodes = res.nodes;
        let nodes = {};
        preNodes.forEach(node => {
          nodes[node.id] = node;
        });

        links.forEach(link =>{
          link.source = nodes[link.source] || (nodes[link.source] = preNodes[link.source]);
          link.target = nodes[link.target] || (nodes[link.target] = preNodes[link.target]);
        });

        

        let drawLink = (d) => {
          ctx.moveTo(d.source.x, d.source.y);
          ctx.lineTo(d.target.x, d.target.y);
        }
        
        let drawNode = (d) => {
          ctx.moveTo(d.x + d.normalizedweight, d.y);
          ctx.arc(d.x, d.y, d.normalizedweight, 0, 2 * Math.PI);
        }

        let tick = () => {
          ctx.clearRect(0,0,this.width, this.height);
          ctx.beginPath();
          links.forEach(drawLink);
          ctx.strokeStyle = '#aaa';
          ctx.stroke();

          ctx.beginPath();
          d3.values(nodes).forEach(drawNode);
          ctx.strokeStyle = "#000";
          ctx.stroke();
        };


        simulation.nodes(d3.values(nodes))
          .on('tick',tick);
        
        simulation.force('link', 
          d3.forceLink().distance(200).links(links));

        let dragSubject = () => {
          console.log(d3.event.x + "," + d3.event.y)
          let result =  simulation.find(d3.event.x, d3.event.y);
          console.log(result);
          return result;
        }

        let dragstarted = () => {
          if (!d3.event.active) simulation.alphaTarget(0.3).restart();
          d3.event.subject.fx = d3.event.subject.x;
          d3.event.subject.fy = d3.event.subject.y;
        }
        
        let dragged = () =>  {
          d3.event.subject.fx = d3.event.x;
          d3.event.subject.fy = d3.event.y;
        }
        
        let dragended = () =>  {
          if (!d3.event.active) simulation.alphaTarget(0);
          d3.event.subject.fx = null;
          d3.event.subject.fy = null;
        }

        
        canvas.call(d3.drag()
              .container(this.node)
              .subject(dragSubject)
              .on("start", dragstarted)
              .on("drag", dragged)
              .on("end", dragended));
      });
  }


  

  render(){
    return (<div>
      <h1>Canvas Graph</h1>
      <canvas ref={node => this.node = node}/>
    </div>)
  }
}

export default CanvasGraph