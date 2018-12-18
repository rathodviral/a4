import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-two-way-bind',
  templateUrl: './two-way-bind.component.html',
  styleUrls: ['./two-way-bind.component.css']
})
export class TwoWayBindComponent implements OnInit {

  attributeTest: string;
  classTest: boolean;
  styleTest: string;
  twoWayTest: string;
  styles: any;

  constructor() { }

  ngOnInit() {
    this.attributeTest = 'test';
    this.classTest = true;
    this.styleTest = 'blue';
    this.twoWayTest = null;
    this.styles = {
      color: 'red',
      fontSize: '10px'
    };
  }

  clickHereToCheckBindings(data) {
    this.classTest = !this.classTest;
    console.log(data);

  }

}
