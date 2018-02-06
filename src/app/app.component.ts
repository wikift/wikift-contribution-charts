/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Component, OnInit, Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, URLSearchParams, QueryEncoder } from '@angular/http';

import * as moment from 'moment';
import * as d3 from 'd3';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
@Injectable()
export class AppComponent implements OnInit {

    // 图标数据
    public data;

    constructor(private http: Http) {
    }

    ngOnInit(): void {
        this.init();
    }

    init() {
        // Initialize random data for the demo
        const now = moment().endOf('day').toDate();
        const time_ago = moment().startOf('day').subtract(10, 'year').toDate();
        this.data = d3.timeDays(time_ago, now).map((dateElement: any, index: number) => {
            return {
                date: dateElement,
                details: Array.apply(null, new Array(Math.floor(Math.random() * 15))).map((e: number, i: number, arr: any) => {
                    return {
                        'date': function () {
                            const projectDate = new Date(dateElement.getTime());
                            projectDate.setHours(Math.floor(Math.random() * 24));
                            projectDate.setMinutes(Math.floor(Math.random() * 60));
                            return projectDate;
                        }(),
                        'value': 3600 * ((arr.length - i) / 5) + Math.floor(Math.random() * 3600) * Math.round(Math.random() * (index / 365))
                    };
                }),
                init: function () {
                    this.total = this.details.reduce((prev: number, e: any) => {
                        return prev + e.value;
                    }, 0);
                    return this;
                }
            }.init();
        });
    }

}
