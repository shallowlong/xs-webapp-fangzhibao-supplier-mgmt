# 纺支宝ERP——供货商管理WebApp

一个用于检查纺支宝ERP内置的供货商的信息是否存在更新的WebApp。<br>
由于纺支宝ERP会默认管理供货商信息，但却没有更新通知功能，有点不方便。<br>
该WebApp提供了一个可交互的UI管理界面，支持解析从纺支宝ERP导出的包含供应商信息的excel文件。<br>
通过上传后对现有信息的比对，从而发现并更新到自己已匹配的供应商模块中，如区域编码，门店顺序，门店地址等信息。<br>

![](screenshot.png)

## 本地安装、运行

```sh
npm install
npm start

> localhost:3001
```

## 基础配置

- 通过 `.env.sample` 复制一个 `.env` 到项目目录，修改配置信息即可
- MySQL（只需要定义数据库，运行会自动建立对应的数据表）
    - CREATE DATABASE IF NOT EXISTS fangzhibao_suppliers_mgmt;
    - 默认数据库用户名/密码：fzb_dbuser/fzb_dbpass
- 默认登录用户名/密码：admin/pass1234

## 技术栈

1. Node.js/npm
2. Express 5.x
3. pino
4. Sequelize
   <del>5. jQuery/bootstrap5</del>

## Backlogs

- [x] 【新增】上传、解析并展示excel文件中的供货商信息数据表
- [x] 【新增】增加对比并更新供货商信息功能
- [x] 【新增】增加登录模块
- [x] 【更新】优化日志
- [x] 【新增】供查询使用的API接口
- [x] 【更新】优化UI部分表格交互和展示逻辑
- [ ] 【新增】提供可以直接导出到纺支宝ERP的供应商管理模块的文件格式支持
- [x] 【新增】增加更新历史查询页面
- [ ] 其他功能优化
