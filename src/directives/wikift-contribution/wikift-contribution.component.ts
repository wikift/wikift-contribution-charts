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
import { Component, EventEmitter, HostListener, Input, Output, ViewChild, OnInit } from '@angular/core';

import { WikiftContributionConfig } from './model/wikift-contribution.model';

import * as moment from 'moment';
import * as d3 from 'd3';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'wikift-contribution-charts',
    templateUrl: './wikift-contribution.component.html',
    styles: [`
    :host {
      position: relative;
      user-select: none;
      -ms-user-select: none;
      -moz-user-select: none;
      -webkit-user-select: none;
    }
    :host >>> .item {
      cursor: pointer;
    }
    :host >>> .label {
      cursor: pointer;
      fill: rgb(170, 170, 170);
    }
    :host >>> .heatmap-tooltip {
      pointer-events: none;
      position: absolute;
      z-index: 9999;
      overflow: hidden;
      padding: 0.3rem;
      font-size: 12px;
      line-height: 14px;
      color: rgb(51, 51, 51);
      background: #495057;
      white-space: nowrap;
      overflow: hidden;
      color: #ffffff;
      padding: 1rem;
      border-radius: 0.3rem;
      text-overflow: ellipsis;
      display: inline-block;
    }
  `]
})
export class WikiftContributionComponent implements OnInit {

    // 图表容器
    @ViewChild('wikiftContributionCharts')
    element: any;

    // 渲染数据
    @Input()
    data: Array<object>;

    // 配置文件
    @Input()
    config: WikiftContributionConfig;

    @Output()
    handler: EventEmitter<object> = new EventEmitter<object>();

    // tslint:disable-next-line:no-output-on-prefix
    @Output()
    onChange: EventEmitter<object> = new EventEmitter<object>();

    // 默认配置
    private gutter = 5;
    private itemGutter = 1;
    private width = 1000;
    private height = 200;
    private itemSize = 10;
    private labelPadding = 40;
    private transitionDuration = 500;
    private inTransition = false;

    // tooltip 配置
    private tooltipWidth = 250;
    private tooltipPadding = 15;

    // 选择的时间区域
    private selected = {};

    // D3 配置信息
    private svg: any;
    private items: any;
    private labels: any;
    private buttons: any;
    private tooltip: any;

    ngOnInit(): void {
        // 如果用户未传递配置信息, 则使用默认配置信息
        if (!this.config) {
            this.config = new WikiftContributionConfig();
        }
    }

    // tslint:disable-next-line:use-life-cycle-interface
    ngOnChanges() {
        // 如果渲染数据为空, 抛出异常
        if (!this.data) {
            throw new Error('wikift contribution charts data not null');
        }
    }

    // tslint:disable-next-line:use-life-cycle-interface
    ngAfterViewInit() {
        const element = this.element.nativeElement;
        // 初始化 svg
        this.svg = d3.select(element)
            .append('svg')
            .attr('class', 'svg');
        // 初始化 svg 全局容器
        this.items = this.svg.append('g');
        this.labels = this.svg.append('g');
        this.buttons = this.svg.append('g');
        // 添加 tooltip
        this.tooltip = d3.select(element).append('div')
            .attr('class', 'heatmap-tooltip')
            .style('opacity', 0);
        this.calculateDimensions();
        this.drawChart();
    }

    /**
     * 计算周期数据
     */
    getNumberOfWeeks() {
        const dayIndex = Math.round((+moment() - +moment().subtract(1, 'year').startOf('week')) / 86400000);
        const colIndex = Math.trunc(dayIndex / 7);
        const numWeeks = colIndex + 1;
        return numWeeks;
    }

    /**
     * 计算图标各项指标尺寸
     */
    calculateDimensions() {
        const element = this.element.nativeElement;
        this.width = element.clientWidth < 1000 ? 1000 : element.clientWidth;
        this.itemSize = ((this.width - this.labelPadding) / this.getNumberOfWeeks() - this.gutter);
        this.height = this.labelPadding + 7 * (this.itemSize + this.gutter);
        this.svg.attr('width', this.width).attr('height', this.height);
    }

    /**
     * 绘制图表
     */
    drawChart() {
        this.drawYearOverviewChart();
        this.onChange.emit({
            start: moment(this.selected['date']).startOf('year'),
            end: moment(this.selected['date']).endOf('year'),
        });
    }

    /**
     * 根据年份进行绘制图表
     */
    drawYearOverviewChart() {
        moment.locale(this.config.locale);
        // 定义开始/结束时间
        const startYear = moment(this.selected['date']).startOf('year');
        const endYear = moment(this.selected['date']).endOf('year');
        // 填充年度数据
        let yearData;
        if (!this.config.isFill) {
            // 不填充数据, 基于传递的展示数据过滤
            yearData = this.data.filter((d: any) => {
                return startYear <= moment(d.date) && moment(d.date) < endYear;
            });
        }
        // 计算当前年份数据最大值
        const maxValue = d3.max(yearData, (d: any) => {
            return d.total;
        });
        const color = d3.scaleLinear<string>().range(['#ffffff', this.config.color]).domain([-0.15 * maxValue, maxValue]);
        // 清空数据, 防止有以前数据导致渲染重复
        this.items.selectAll('.item-circle').remove();
        // 渲染年度数据到图表
        this.items.selectAll('.item-circle').data(yearData).enter().append('rect')
            .attr('class', 'item item-circle').style('opacity', 0)
            .attr('x', (item: any) => {
                return this.calcItemX(item, startYear) + (this.itemSize - this.calcItemSize(item, maxValue)) / 2;
            })
            .attr('y', (item: any) => {
                return this.calcItemY(item) + (this.itemSize - this.calcItemSize(item, maxValue)) / 2;
            })
            .attr('width', (item: any) => {
                return this.calcItemSize(item, maxValue);
            })
            .attr('height', (item: any) => {
                return this.calcItemSize(item, maxValue);
            })
            .attr('fill', (item: any) => {
                return (item.total > 0) ? color(item.total) : this.config.fillColor;
            })
            .on('mouseover', (item: any) => {
                if (this.inTransition) {
                    return;
                }
                const circle = d3.select(d3.event.currentTarget);
                const repeat = () => {
                    circle.transition().duration(this.transitionDuration).ease(d3.easeLinear)
                        .attr('x', (item: any) => {
                            return this.calcItemX(item, startYear) - (this.itemSize * 1.1 - this.itemSize) / 2;
                        })
                        .attr('y', (item: any) => {
                            return this.calcItemY(item) - (this.itemSize * 1.1 - this.itemSize) / 2;
                        })
                        .attr('width', this.itemSize * 1.1)
                        .attr('height', this.itemSize * 1.1)
                        .transition().duration(this.transitionDuration).ease(d3.easeLinear)
                        .attr('x', (item: any) => {
                            return this.calcItemX(item, startYear) + (this.itemSize - this.calcItemSize(item, maxValue)) / 2;
                        })
                        .attr('y', (item: any) => {
                            return this.calcItemY(item) + (this.itemSize - this.calcItemSize(item, maxValue)) / 2;
                        })
                        .attr('width', (item: any) => {
                            return this.calcItemSize(item, maxValue);
                        })
                        .attr('height', (item: any) => {
                            return this.calcItemSize(item, maxValue);
                        })
                        .on('end', repeat);
                };
                repeat();
                // tooltip 展示数据
                const tooltipHtml = '<div><strong>' + (item.total ? item.total : '0') +
                    ' 条数据创建于 ' + moment(item.date).format('dddd, MMM Do YYYY') + '</strong></div>';
                let x = this.calcItemX(item, startYear) + this.itemSize / 2;
                if (this.width - x < (this.tooltipWidth + this.tooltipPadding * 3)) {
                    x -= this.tooltipWidth + this.tooltipPadding * 2;
                }
                const y = this.calcItemY(item) + this.itemSize / 2;
                this.tooltip.html(tooltipHtml).style('left', x + 'px')
                    .style('top', y + 'px').transition().duration(this.transitionDuration / 2)
                    .ease(d3.easeLinear).style('opacity', 1);
            })
            .on('mouseout', () => {
                if (this.inTransition) {
                    return;
                }
                d3.select(d3.event.currentTarget).transition()
                    .duration(this.transitionDuration / 2).ease(d3.easeLinear)
                    .attr('x', (item: any) => {
                        return this.calcItemX(item, startYear) + (this.itemSize - this.calcItemSize(item, maxValue)) / 2;
                    })
                    .attr('y', (item: any) => {
                        return this.calcItemY(item) + (this.itemSize - this.calcItemSize(item, maxValue)) / 2;
                    })
                    .attr('width', (item: any) => {
                        return this.calcItemSize(item, maxValue);
                    })
                    .attr('height', (item: any) => {
                        return this.calcItemSize(item, maxValue);
                    });
                this.hideTooltip();
            })
            .transition()
            .delay(() => {
                return (Math.cos(Math.PI * Math.random()) + 1) * this.transitionDuration;
            })
            .duration(() => {
                return this.transitionDuration;
            })
            .ease(d3.easeLinear).style('opacity', 1)
            .call((transition: any, callback: any) => {
                if (transition.empty()) {
                    callback();
                }
                let n = 0;
                transition
                    .each(() => ++n)
                    .on('end', function () {
                        if (!--n) {
                            callback.apply(this, arguments);
                        }
                    });
            }, () => {
                this.inTransition = false;
            });
        // 渲染当前年份下所有月份
        const monthLabels = d3.timeMonths(startYear.toDate(), endYear.toDate());
        const monthScale = d3.scaleLinear().range([0, this.width]).domain([0, monthLabels.length]);
        this.labels.selectAll('.label-month').remove();
        this.labels.selectAll('.label-month').data(monthLabels)
            .enter().append('text').attr('class', 'label label-month')
            .attr('font-size', () => {
                return Math.floor(this.labelPadding / 3) + 'px';
            })
            .text((item: any) => {
                return item.toLocaleDateString(this.config.locale, { month: 'short' });
            })
            .attr('x', (item: any, i: number) => {
                return monthScale(i) + (monthScale(i) - monthScale(i - 1)) / 2;
            })
            .attr('y', this.labelPadding / 2)
            .on('mouseenter', (item: any) => {
                if (this.inTransition) {
                    return;
                }
                // 鼠标移向时, 抽取当前月份下所有的天数数据高亮显示
                const selectedMonth = moment(item);
                this.items.selectAll('.item-circle').transition()
                    .duration(this.transitionDuration).ease(d3.easeLinear)
                    .style('opacity', (monthItem: any) => {
                        return moment(monthItem.date).isSame(selectedMonth, 'month') ? 1 : 0.1;
                    });
            })
            .on('mouseout', () => {
                if (this.inTransition) {
                    return;
                }
                this.items.selectAll('.item-circle').transition()
                    .duration(this.transitionDuration).ease(d3.easeLinear).style('opacity', 1);
            });
        // 渲染周数据
        const dayLabels = d3.timeDays(
            moment().startOf('week').toDate(),
            moment().endOf('week').toDate()
        );
        const dayScale = d3.scaleBand()
            .rangeRound([this.labelPadding, this.height])
            .domain(dayLabels.map((d: any) => {
                return moment(d).weekday().toString();
            }));
        this.labels.selectAll('.label-day').remove();
        this.labels.selectAll('.label-day').data(dayLabels).enter()
            .append('text').attr('class', 'label label-day').attr('x', this.labelPadding / 3)
            .attr('y', (item: any, i: number) => {
                return dayScale((i).toString()) + dayScale.bandwidth() / 1.75;
            })
            .style('text-anchor', 'left')
            .attr('font-size', () => {
                return Math.floor(this.labelPadding / 3) + 'px';
            })
            .text((item: any) => {
                // 如果中文时区则截取汉字最后一位
                if (this.config.locale === 'zh-cn') {
                    return moment(item).format('dddd')[2];
                }
                return moment(item).format('dddd')[0];
            })
            .on('mouseenter', (item: any) => {
                if (this.inTransition) {
                    return;
                }
                const selected_day = moment(item);
                this.items.selectAll('.item-circle').transition()
                    .duration(this.transitionDuration).ease(d3.easeLinear)
                    .style('opacity', (d: any) => {
                        return (moment(d.date).day() === selected_day.day()) ? 1 : 0.1;
                    });
            })
            .on('mouseout', () => {
                if (this.inTransition) {
                    return;
                }
                this.items.selectAll('.item-circle').transition().duration(this.transitionDuration)
                    .ease(d3.easeLinear).style('opacity', 1);
            });
    }

    /**
     * 计算元素 X 轴位置
     * @param item 元素
     * @param startYear 开始年份
     */
    calcItemX(item: any, startYear: any) {
        const date = moment(item.date);
        const dayIndex = Math.round((+date - +moment(startYear).startOf('week')) / 86400000);
        const colIndex = Math.trunc(dayIndex / 7);
        return colIndex * (this.itemSize + this.gutter) + this.labelPadding;
    }

    /**
     * 计算当前元素 Y 轴位置
     * @param item 元素
     */
    calcItemY(item: any) {
        return this.labelPadding + moment(item.date).weekday() * (this.itemSize + this.gutter);
    }

    /**
     * 计算当前元素项尺寸
     * @param item 当前元素
     * @param max 最大值
     */
    calcItemSize(item: any, max: number) {
        if (max <= 0) {
            return this.itemSize;
        }
        return this.itemSize * 0.75 + (this.itemSize * item.total / max) * 0.25;
    }

    hideTooltip() {
        this.tooltip.transition()
            .duration(this.transitionDuration / 2)
            .ease(d3.easeLinear)
            .style('opacity', 0);
    }

    formatTime(seconds: number) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds - (hours * 3600)) / 60);
        let time = '';
        if (hours > 0) {
            time += hours === 1 ? '1 hour ' : hours + ' hours ';
        }
        if (minutes > 0) {
            time += minutes === 1 ? '1 minute' : minutes + ' minutes';
        }
        if (hours === 0 && minutes === 0) {
            time = Math.round(seconds) + ' seconds';
        }
        return time;
    }

}
