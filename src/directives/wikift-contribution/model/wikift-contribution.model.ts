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
export class WikiftContributionConfig {

    // 渲染的数据颜色
    public color = '#7bc96f';
    // 默认填充颜色
    public fillColor = '#ebedf0';
    // 渲染的数据展示时区
    public locale = 'zh-cn';
    // 当后端数据传递为非全年数据, 是否自动填充数据
    public isFill = false;

    constructor() {
    }

}
