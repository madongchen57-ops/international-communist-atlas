# 来源与迁移记录

## 固定来源

导入时间：2026-10-25。来源仓库：https://github.com/yidiao/QmlmReader 。本地整理版没有 `.git`，不推定GitHub最新提交就是本地内容。文件级SHA-256见 `sources/migration-manifest.json`。

原栏目八页及第三国际介绍的原始页面保存在 `sources/pages/`。八部文献JSON或HTML保存在 `sources/readings/`。构建不读取原项目目录；迁移脚本仅用于记录首次导入过程，不属于构建链。

## 八部文献

| 原作者 | 作品 | 本项目入口 |
|---|---|---|
| 马克思 | 法兰西内战 | readings/civil-war.html |
| 列宁 | 第二国际的破产 | readings/second-international.html |
| 列宁 | 国家与革命 | readings/state-revolution.html |
| 斯大林 | 论列宁主义基础 | readings/foundations-leninism.html |
| 联共（布）中央特设委员会编 | 联共（布）党史简明教程 | readings/short-course.html |
| 季米特洛夫 | 法西斯主义的进攻与共产国际的任务 | readings/united-front.html |
| 毛泽东 | 新民主主义论 | readings/new-democracy.html |
| 季米特洛夫 | 就援助西班牙给第二国际主席的电报 | readings/aid-spain.html |

正文按原站JSON逐段对照可见正文索引；HTML正文按解码后实际文本核对。版本、收录范围及已知OCR问题沿用底本说明。现有来源中的摘录、编者按和附录范围不因迁移而改称完整独立原著。

《论列宁主义基础》原索引有四处重复使用段落ID（相同短句再次出现）。新页面保留首次原ID，后续重复位置附加 `--occurrence-N`，并用 `originalId` 记录原值，避免重复DOM ID误定位；全部原有ID仍可访问。未更改原文文字。

## 地图

- 高精度原生平面底图：https://bzdt.ch.mnr.gov.cn/data/topodata/worldtopo_h.json
- 伴随底图及中国区域、南海诸岛归属范围线：https://bzdt.ch.mnr.gov.cn/data/topodata/worldtopo.json
- 官方服务：https://bzdt.ch.mnr.gov.cn/
- 中国政府南海声明：https://www.mfa.gov.cn/web/zyxw/201607/t20160712_338577.shtml

高精度底图用于212个国家／地区参考面和边界。伴随底图坐标除以1000，仅补充中国区域中26个南部岛屿陆地要素及原有范围线；不将低精度大陆边界叠加到高精度边界。群岛名称锚点是位置示意，不是岛屿轮廓或实际控制区。未将高精度源中无名称、无归属的195个世界岛屿点擅自归入中国。

显示规则由 `displayPolicy` 声明：中国从1949年截面起固定红色，适用于三种底色模式；历史分类数据不改。中国群岛组由 `ownerId: CHN` 表示，不作为独立国家统计。南海范围线仅描线，海域保持海洋底色。

## 栏目整理

- 导航、主题、光标、搜索和阅读存储脱离原站，使用 `icm-atlas:` 键。
- 专栏筹备项改为不可点击状态，不补造正文。
- 旧时事内容标为档案，保留原日期。
- 第三国际介绍中的“报告节选”入口改为所迁移版本的报告入口；相关电报另有全文页。
- 九评未纳入本次八部文献范围，其历史节点提供可追溯的外部原文目录，不产生失效站内链接。
- 没有更改原项目正文、段落ID或存储键；本轮不批量删除文件或目录。
