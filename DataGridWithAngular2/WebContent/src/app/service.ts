import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/Rx';
import {Observable} from 'rxjs/Observable';

@Injectable() 

export class Service {
  
  constructor(private http: Http) {}
  
  getJsonData() {
    return this.http.get('app/jsonData.json')
      .map(res => res.json())
  }
}


