#!/usr/bin/env node
/**
 * 从各章节 MDX 正文中提取关键地名，
 * 更新 places.json 和 MDX meta.map.features / camera。
 *
 * 策略：
 *  1. 维护一个全量地名词典 PLACE_DICT (名称→placeId)
 *  2. 维护一个 placeId→坐标+元信息 的 PLACE_DEFS 表
 *  3. 逐章扫描正文，匹配词典中的地名，按出现顺序+频次排序
 *  4. 取 top-N 作为 features（第一个出现的设为 primary，其余 context）
 *  5. camera 设为 autoFit
 */
const fs = require('fs');
const path = require('path');

const WORKSPACE = path.resolve(__dirname, '..');
const CONTENT_BASE = path.join(WORKSPACE, 'apps/sun/content/mao-dazhuan');
const PLACES_JSON = path.join(WORKSPACE, 'apps/sun/public/data/mao-dazhuan/geo/places.json');
const PLACES_JSON2 = path.join(WORKSPACE, 'apps/sun/data/mao-dazhuan/geo/places.json');

// =====================================================================
// 地点定义：id → { name, aliases, coord, level, notes }
// =====================================================================
const PLACE_DEFS = {
  // --- 湖南 ---
  'shaoshan-chong': { name: '韶山冲', aliases: ['韶山'], coord: { lng: 112.5265, lat: 27.9150 }, level: 'village' },
  'shangwuchang': { name: '上屋场', aliases: [], coord: { lng: 112.5268, lat: 27.9148 }, level: 'poi' },
  'shao-feng': { name: '韶峰', aliases: ['仙女峰'], coord: { lng: 112.5180, lat: 27.9050 }, level: 'poi' },
  'xiangtan': { name: '湘潭', aliases: ['湘潭县'], coord: { lng: 112.9440, lat: 27.8290 }, level: 'city' },
  'changsha': { name: '长沙', aliases: ['省城长沙'], coord: { lng: 112.9388, lat: 28.2282 }, level: 'city' },
  'tangjiayuan': { name: '唐家圫', aliases: ['棠佳阁'], coord: { lng: 112.4500, lat: 27.8800 }, level: 'village' },
  'xiangxiang': { name: '湘乡', aliases: ['湘乡县'], coord: { lng: 112.5352, lat: 27.7345 }, level: 'county' },
  'ningxiang': { name: '宁乡', aliases: ['宁乡县'], coord: { lng: 112.5515, lat: 28.2553 }, level: 'county' },
  'yintiansi': { name: '银田寺', aliases: [], coord: { lng: 112.5100, lat: 27.9300 }, level: 'poi' },
  'juzizhou': { name: '橘子洲', aliases: ['橘子洲头'], coord: { lng: 112.9614, lat: 28.1856 }, level: 'poi' },
  'hengyang': { name: '衡阳', aliases: ['衡阳县'], coord: { lng: 112.5720, lat: 26.8930 }, level: 'city' },
  'hengshan': { name: '衡山', aliases: ['南岳衡山'], coord: { lng: 112.8680, lat: 27.2320 }, level: 'county' },
  'liuyang': { name: '浏阳', aliases: ['浏阳县'], coord: { lng: 113.6432, lat: 28.1637 }, level: 'county' },
  'liling': { name: '醴陵', aliases: ['醴陵县'], coord: { lng: 113.4969, lat: 27.6462 }, level: 'county' },
  'yueyang': { name: '岳阳', aliases: ['岳阳县', '岳州'], coord: { lng: 113.1282, lat: 29.3568 }, level: 'city' },
  'changde': { name: '常德', aliases: [], coord: { lng: 111.6987, lat: 29.0317 }, level: 'city' },
  'yiyang': { name: '益阳', aliases: [], coord: { lng: 112.3550, lat: 28.5539 }, level: 'city' },
  'anhua': { name: '安化', aliases: ['安化县'], coord: { lng: 111.2131, lat: 28.3773 }, level: 'county' },
  'pingjiang': { name: '平江', aliases: ['平江县'], coord: { lng: 113.5811, lat: 28.7023 }, level: 'county' },
  'chaling': { name: '茶陵', aliases: ['茶陵县'], coord: { lng: 113.5388, lat: 26.7772 }, level: 'county' },
  'youxian': { name: '攸县', aliases: [], coord: { lng: 113.3963, lat: 27.0005 }, level: 'county' },
  'anren': { name: '安仁', aliases: ['安仁县'], coord: { lng: 113.2693, lat: 26.7094 }, level: 'county' },
  'dongshan-school': { name: '东山学堂', aliases: ['东山高等小学堂', '东山书院'], coord: { lng: 112.5320, lat: 27.7380 }, level: 'poi', notes: '湘乡东山高等小学堂' },
  'hunan-yishi': { name: '湖南第一师范', aliases: ['第一师范', '一师', '省立第一师范'], coord: { lng: 112.9700, lat: 28.1830 }, level: 'poi', notes: '湖南省立第一师范学校' },
  'yuelu-shuyuan': { name: '岳麓书院', aliases: ['岳麓山'], coord: { lng: 112.9440, lat: 28.1855 }, level: 'poi' },
  'chuanshan-shuyuan': { name: '船山学社', aliases: ['船山学堂'], coord: { lng: 112.9760, lat: 28.1960 }, level: 'poi' },
  'qingshuitang': { name: '清水塘', aliases: [], coord: { lng: 112.9850, lat: 28.2040 }, level: 'poi', notes: '中共湖南支部机关驻地' },
  'anyuan': { name: '安源', aliases: ['安源煤矿', '安源路矿'], coord: { lng: 113.8550, lat: 27.6150 }, level: 'poi', notes: '安源路矿工人运动旧址' },
  'shuikoushan': { name: '水口山', aliases: ['水口山矿'], coord: { lng: 112.4780, lat: 26.7220 }, level: 'poi', notes: '水口山铅锌矿' },
  'shaoshan-nongxie': { name: '韶山农民协会', aliases: [], coord: { lng: 112.5270, lat: 27.9155 }, level: 'poi' },
  'nongmin-yundong-jiangxisuo': { name: '农民运动讲习所', aliases: ['农讲所'], coord: { lng: 113.2690, lat: 23.1290 }, level: 'poi', notes: '广州农民运动讲习所' },
  'wuchang-nongjiang': { name: '武昌农讲所', aliases: ['武昌中央农民运动讲习所'], coord: { lng: 114.3160, lat: 30.5350 }, level: 'poi' },

  // --- 北京 ---
  'beijing': { name: '北京', aliases: ['北平', '京城', '京师'], coord: { lng: 116.4074, lat: 39.9042 }, level: 'city' },
  'beida': { name: '北京大学', aliases: ['北大'], coord: { lng: 116.3103, lat: 39.9929 }, level: 'poi', notes: '北京大学（原沙滩红楼）' },
  'gugong': { name: '故宫', aliases: ['紫禁城'], coord: { lng: 116.3972, lat: 39.9169 }, level: 'poi' },
  'changxindian': { name: '长辛店', aliases: [], coord: { lng: 116.1560, lat: 39.8420 }, level: 'poi', notes: '长辛店机车厂，工人运动发源地之一' },

  // --- 上海 ---
  'shanghai': { name: '上海', aliases: [], coord: { lng: 121.4737, lat: 31.2304 }, level: 'city' },
  'yidahuizhi': { name: '一大会址', aliases: [], coord: { lng: 121.4750, lat: 31.2230 }, level: 'poi', notes: '中共一大会址，上海法租界望志路106号' },

  // --- 广东 ---
  'guangzhou': { name: '广州', aliases: ['广东'], coord: { lng: 113.2644, lat: 23.1291 }, level: 'city' },
  'shantou': { name: '汕头', aliases: [], coord: { lng: 116.6822, lat: 23.3535 }, level: 'city' },
  'huangpu-junxiao': { name: '黄埔军校', aliases: ['黄埔'], coord: { lng: 113.4200, lat: 23.0930 }, level: 'poi' },
  'haifeng': { name: '海丰', aliases: ['海丰县'], coord: { lng: 115.3567, lat: 22.9663 }, level: 'county' },
  'lufeng': { name: '陆丰', aliases: ['陆丰县'], coord: { lng: 115.6480, lat: 22.9452 }, level: 'county' },

  // --- 武汉三镇 ---
  'wuhan': { name: '武汉', aliases: [], coord: { lng: 114.3054, lat: 30.5931 }, level: 'city' },
  'wuchang': { name: '武昌', aliases: [], coord: { lng: 114.3160, lat: 30.5350 }, level: 'city' },
  'hankou': { name: '汉口', aliases: [], coord: { lng: 114.2700, lat: 30.5830 }, level: 'city' },

  // --- 江西 ---
  'nanchang': { name: '南昌', aliases: [], coord: { lng: 115.8579, lat: 28.6820 }, level: 'city' },
  'jinggangshan': { name: '井冈山', aliases: ['井岗山'], coord: { lng: 114.1672, lat: 26.5867 }, level: 'county', notes: '井冈山革命根据地' },
  'ciping': { name: '茨坪', aliases: [], coord: { lng: 114.1550, lat: 26.5770 }, level: 'poi', notes: '井冈山根据地中心' },
  'maoping': { name: '茅坪', aliases: [], coord: { lng: 114.1370, lat: 26.6530 }, level: 'poi', notes: '八角楼所在地' },
  'longshi': { name: '龙市', aliases: ['龙市镇'], coord: { lng: 114.0650, lat: 26.6250 }, level: 'poi', notes: '井冈山会师地' },
  'ruijin': { name: '瑞金', aliases: ['瑞金县'], coord: { lng: 116.0272, lat: 25.8816 }, level: 'county', notes: '中华苏维埃共和国临时中央所在地' },
  'jian': { name: '吉安', aliases: ['吉安县'], coord: { lng: 114.9927, lat: 27.1138 }, level: 'city' },
  'yongxin': { name: '永新', aliases: ['永新县'], coord: { lng: 114.2415, lat: 26.9450 }, level: 'county' },
  'lianhua': { name: '莲花', aliases: ['莲花县'], coord: { lng: 113.9614, lat: 27.1286 }, level: 'county' },
  'ninggang': { name: '宁冈', aliases: ['宁冈县'], coord: { lng: 114.1500, lat: 26.6800 }, level: 'county' },
  'suichuan': { name: '遂川', aliases: ['遂川县'], coord: { lng: 114.5204, lat: 26.3136 }, level: 'county' },
  'xingguo': { name: '兴国', aliases: ['兴国县'], coord: { lng: 115.3632, lat: 26.3378 }, level: 'county' },
  'yudu': { name: '于都', aliases: ['于都县', '雩都'], coord: { lng: 115.4151, lat: 25.9521 }, level: 'county', notes: '中央红军长征出发地' },
  'huichang': { name: '会昌', aliases: ['会昌县'], coord: { lng: 115.7866, lat: 25.6006 }, level: 'county' },
  'ningdu': { name: '宁都', aliases: ['宁都县'], coord: { lng: 116.0099, lat: 26.4720 }, level: 'county' },
  'guangchang': { name: '广昌', aliases: ['广昌县'], coord: { lng: 116.3326, lat: 26.8433 }, level: 'county' },
  'lichuan': { name: '黎川', aliases: ['黎川县'], coord: { lng: 116.9074, lat: 27.2829 }, level: 'county' },
  'jianning': { name: '建宁', aliases: ['建宁县'], coord: { lng: 116.8460, lat: 26.8325 }, level: 'county' },
  'taining': { name: '泰宁', aliases: ['泰宁县'], coord: { lng: 117.1742, lat: 26.9001 }, level: 'county' },
  'wanan': { name: '万安', aliases: ['万安县'], coord: { lng: 114.7836, lat: 26.4568 }, level: 'county' },
  'dayu': { name: '大余', aliases: ['大庾', '大余县'], coord: { lng: 114.3617, lat: 25.4012 }, level: 'county' },

  // --- 福建 ---
  'longyan': { name: '龙岩', aliases: ['龙岩县'], coord: { lng: 117.0176, lat: 25.0754 }, level: 'city' },
  'shanghang': { name: '上杭', aliases: ['上杭县'], coord: { lng: 116.4206, lat: 25.0491 }, level: 'county' },
  'gutian': { name: '古田', aliases: [], coord: { lng: 116.6070, lat: 25.2300 }, level: 'poi', notes: '古田会议旧址' },
  'changting': { name: '长汀', aliases: ['长汀县', '汀州'], coord: { lng: 116.3587, lat: 25.8274 }, level: 'county' },
  'yongding': { name: '永定', aliases: ['永定县'], coord: { lng: 116.7320, lat: 24.7230 }, level: 'county' },
  'zhangzhou': { name: '漳州', aliases: [], coord: { lng: 117.6470, lat: 24.5128 }, level: 'city' },
  'xiamen': { name: '厦门', aliases: [], coord: { lng: 118.0894, lat: 24.4798 }, level: 'city' },

  // --- 长征沿线 ---
  'zunyi': { name: '遵义', aliases: ['遵义县'], coord: { lng: 106.9271, lat: 27.7256 }, level: 'city', notes: '遵义会议旧址' },
  'chishui': { name: '赤水', aliases: ['赤水河'], coord: { lng: 105.6976, lat: 28.5903 }, level: 'county' },
  'wujiang': { name: '乌江', aliases: [], coord: { lng: 106.7500, lat: 27.3000 }, level: 'poi', notes: '乌江天险' },
  'jinshajiang': { name: '金沙江', aliases: [], coord: { lng: 103.6000, lat: 26.8700 }, level: 'poi', notes: '巧渡金沙江渡口' },
  'ludingqiao': { name: '泸定桥', aliases: ['泸定'], coord: { lng: 102.2340, lat: 29.9160 }, level: 'poi', notes: '飞夺泸定桥' },
  'dadu-he': { name: '大渡河', aliases: [], coord: { lng: 102.4500, lat: 29.5500 }, level: 'poi' },
  'anshunchang': { name: '安顺场', aliases: [], coord: { lng: 102.4080, lat: 29.2630 }, level: 'poi', notes: '强渡大渡河' },
  'jiajinshan': { name: '夹金山', aliases: [], coord: { lng: 102.7500, lat: 30.8500 }, level: 'poi', notes: '红军翻越的第一座大雪山' },
  'maogong': { name: '懋功', aliases: ['小金', '小金县'], coord: { lng: 102.3612, lat: 31.0036 }, level: 'county', notes: '红一、四方面军会师地' },
  'caodi': { name: '草地', aliases: ['松潘草地', '若尔盖草地'], coord: { lng: 102.9628, lat: 33.5749 }, level: 'poi', notes: '红军过草地' },
  'lazikou': { name: '腊子口', aliases: [], coord: { lng: 104.0100, lat: 34.0600 }, level: 'poi', notes: '天险腊子口战斗' },
  'hadapu': { name: '哈达铺', aliases: [], coord: { lng: 104.0900, lat: 34.0800 }, level: 'poi', notes: '红军在此获知陕北根据地信息' },
  'wuqi': { name: '吴起', aliases: ['吴起镇', '吴旗'], coord: { lng: 108.1756, lat: 36.9272 }, level: 'county', notes: '中央红军长征终点' },
  'yanan': { name: '延安', aliases: [], coord: { lng: 109.4892, lat: 36.5853 }, level: 'city' },
  'baoan': { name: '保安', aliases: ['志丹'], coord: { lng: 108.7688, lat: 36.8219 }, level: 'county' },
  'wayaobao': { name: '瓦窑堡', aliases: [], coord: { lng: 109.9690, lat: 37.0040 }, level: 'poi' },
  'huining': { name: '会宁', aliases: ['会宁县'], coord: { lng: 105.0960, lat: 35.6927 }, level: 'county', notes: '红军三大主力会师地' },
  'liupanshan': { name: '六盘山', aliases: [], coord: { lng: 106.1030, lat: 35.7640 }, level: 'poi' },
  'tongdao': { name: '通道', aliases: ['通道县'], coord: { lng: 109.7838, lat: 26.1590 }, level: 'county' },
  'liping': { name: '黎平', aliases: ['黎平县'], coord: { lng: 109.1361, lat: 26.2310 }, level: 'county' },
  'loushan-guan': { name: '娄山关', aliases: [], coord: { lng: 106.8500, lat: 28.0900 }, level: 'poi' },
  'tucheng': { name: '土城', aliases: [], coord: { lng: 105.9700, lat: 28.3000 }, level: 'poi' },
  'zhajin': { name: '扎金', aliases: ['扎佐'], coord: { lng: 106.7500, lat: 27.0000 }, level: 'poi' },
  'bijie': { name: '毕节', aliases: ['毕节县'], coord: { lng: 105.2852, lat: 27.3017 }, level: 'city' },
  'huili': { name: '会理', aliases: ['会理县'], coord: { lng: 102.2444, lat: 26.6558 }, level: 'county' },
  'jiaopingdu': { name: '皎平渡', aliases: [], coord: { lng: 103.2100, lat: 26.3300 }, level: 'poi', notes: '巧渡金沙江渡口' },

  // --- 广西 ---
  'guilin': { name: '桂林', aliases: [], coord: { lng: 110.2900, lat: 25.2740 }, level: 'city' },
  'quanzhou-gx': { name: '全州', aliases: ['全州县'], coord: { lng: 111.0720, lat: 25.9280 }, level: 'county' },
  'xingangx': { name: '兴安', aliases: ['兴安县'], coord: { lng: 110.6712, lat: 25.6117 }, level: 'county' },
  'xiangjiang-zhanyi': { name: '湘江战役', aliases: ['湘江'], coord: { lng: 110.9500, lat: 25.8000 }, level: 'poi', notes: '湘江战役主战场' },

  // --- 贵州 ---
  'guiyang': { name: '贵阳', aliases: [], coord: { lng: 106.7135, lat: 26.6473 }, level: 'city' },

  // --- 四川 ---
  'chengdu': { name: '成都', aliases: [], coord: { lng: 104.0657, lat: 30.5723 }, level: 'city' },
  'luzhou': { name: '泸州', aliases: [], coord: { lng: 105.4432, lat: 28.8717 }, level: 'city' },

  // --- 云南 ---
  'kunming': { name: '昆明', aliases: [], coord: { lng: 102.8329, lat: 25.0389 }, level: 'city' },

  // --- 其他重要城市 ---
  'nanjing': { name: '南京', aliases: [], coord: { lng: 118.7969, lat: 32.0603 }, level: 'city' },
  'tianjin': { name: '天津', aliases: [], coord: { lng: 117.1907, lat: 39.1256 }, level: 'city' },
  'chongqing': { name: '重庆', aliases: [], coord: { lng: 106.5516, lat: 29.5630 }, level: 'city' },
  'jinan': { name: '济南', aliases: [], coord: { lng: 117.0009, lat: 36.6758 }, level: 'city' },
  'kaifeng': { name: '开封', aliases: [], coord: { lng: 114.3079, lat: 34.7971 }, level: 'city' },
  'zhengzhou': { name: '郑州', aliases: [], coord: { lng: 113.6254, lat: 34.7466 }, level: 'city' },

  // --- 秋收起义 / 湘赣边 ---
  'tonggu': { name: '铜鼓', aliases: ['铜鼓县'], coord: { lng: 114.3713, lat: 28.5228 }, level: 'county' },
  'xiushui': { name: '修水', aliases: ['修水县'], coord: { lng: 114.5465, lat: 29.0254 }, level: 'county' },
  'wenjiashi': { name: '文家市', aliases: [], coord: { lng: 113.6800, lat: 28.1800 }, level: 'poi', notes: '秋收起义文家市会师' },
  'sanwan': { name: '三湾', aliases: ['三湾村'], coord: { lng: 114.2570, lat: 26.9890 }, level: 'poi', notes: '三湾改编旧址' },
  'gutian-huiyi': { name: '古田会议', aliases: [], coord: { lng: 116.6070, lat: 25.2300 }, level: 'poi' },

  // --- 湘南 ---
  'chenzhou': { name: '郴州', aliases: ['郴县'], coord: { lng: 113.0147, lat: 25.7822 }, level: 'city' },
  'yizhang': { name: '宜章', aliases: ['宜章县'], coord: { lng: 112.9517, lat: 25.3189 }, level: 'county' },
  'linwu': { name: '临武', aliases: ['临武县'], coord: { lng: 112.5638, lat: 25.2756 }, level: 'county' },
  'guidong': { name: '桂东', aliases: ['桂东县'], coord: { lng: 113.9472, lat: 26.0800 }, level: 'county' },
  'rucheng': { name: '汝城', aliases: ['汝城县'], coord: { lng: 113.6847, lat: 25.5510 }, level: 'county' },
  'daoxian': { name: '道县', aliases: [], coord: { lng: 111.5928, lat: 25.5268 }, level: 'county' },
  'jianghua': { name: '江华', aliases: ['江华县'], coord: { lng: 111.5885, lat: 25.1852 }, level: 'county' },

  // --- 其他 ---
  'baise': { name: '百色', aliases: [], coord: { lng: 106.6180, lat: 23.9020 }, level: 'city' },
  'fayuan': { name: '法源', aliases: [], coord: { lng: 113.0000, lat: 23.0000 }, level: 'poi' },
  'dingwangtai': { name: '定王台', aliases: [], coord: { lng: 112.9830, lat: 28.1970 }, level: 'poi', notes: '长沙定王台图书馆' },
  'xinshaoli': { name: '新少里', aliases: [], coord: { lng: 112.9850, lat: 28.2000 }, level: 'poi' },
  'xinmin-xuehui': { name: '新民学会', aliases: [], coord: { lng: 112.9550, lat: 28.2250 }, level: 'poi', notes: '新民学会旧址，刘家台子' },
  'zijiachong': { name: '紫家冲', aliases: [], coord: { lng: 112.5200, lat: 27.9100 }, level: 'poi' },
  'yuelushan': { name: '岳麓山', aliases: [], coord: { lng: 112.9350, lat: 28.1850 }, level: 'poi' },
  'huanghuagang': { name: '黄花岗', aliases: [], coord: { lng: 113.2930, lat: 23.1480 }, level: 'poi' },
  'pingshangguan': { name: '平型关', aliases: [], coord: { lng: 113.7000, lat: 39.3800 }, level: 'poi' },
  'dabaidi': { name: '大柏地', aliases: [], coord: { lng: 116.1400, lat: 26.4500 }, level: 'poi', notes: '大柏地战斗旧址' },
  'donggu': { name: '东固', aliases: ['东固山'], coord: { lng: 115.2500, lat: 26.8500 }, level: 'poi', notes: '东固革命根据地' },
  'xinyu': { name: '新余', aliases: ['新喻'], coord: { lng: 114.9300, lat: 27.8170 }, level: 'city' },
  'fengcheng': { name: '丰城', aliases: [], coord: { lng: 115.7710, lat: 28.1590 }, level: 'county' },
  'zhangshu': { name: '樟树', aliases: [], coord: { lng: 115.5470, lat: 28.0530 }, level: 'county' },
  'futian': { name: '富田', aliases: [], coord: { lng: 115.1400, lat: 26.8800 }, level: 'poi', notes: '富田事变发生地' },
  'huangpi': { name: '黄陂', aliases: [], coord: { lng: 116.0800, lat: 26.4200 }, level: 'poi', notes: '第一次反围剿战场' },
  'longgang': { name: '龙冈', aliases: [], coord: { lng: 116.0200, lat: 26.5500 }, level: 'poi', notes: '龙冈战斗' },
  'dongshao': { name: '东韶', aliases: [], coord: { lng: 115.7200, lat: 26.8600 }, level: 'poi' },
  'qianligang': { name: '千里岗', aliases: [], coord: { lng: 115.0000, lat: 26.2000 }, level: 'poi' },
  'caotaigang': { name: '草台岗', aliases: [], coord: { lng: 116.0500, lat: 27.1500 }, level: 'poi' },
  'shaoxing': { name: '绍兴', aliases: [], coord: { lng: 120.5820, lat: 29.9960 }, level: 'city' },
  'hangzhou': { name: '杭州', aliases: [], coord: { lng: 120.1551, lat: 30.2741 }, level: 'city' },

  // --- 陕甘宁 ---
  'ganquan': { name: '甘泉', aliases: ['甘泉县'], coord: { lng: 109.3514, lat: 36.2765 }, level: 'county' },
  'dingbian': { name: '定边', aliases: ['定边县'], coord: { lng: 107.6013, lat: 37.5953 }, level: 'county' },
  'zhiluo': { name: '直罗', aliases: ['直罗镇'], coord: { lng: 108.9000, lat: 35.9000 }, level: 'poi' },
};

// =====================================================================
// 地名 → placeId 映射（从 PLACE_DEFS 自动构建 + 额外别名）
// =====================================================================
const NAME_TO_ID = {};
for (const [id, def] of Object.entries(PLACE_DEFS)) {
  NAME_TO_ID[def.name] = id;
  for (const alias of (def.aliases || [])) {
    NAME_TO_ID[alias] = id;
  }
}

// 额外映射（文本中出现的变体写法）
Object.assign(NAME_TO_ID, {
  '韶山冲': 'shaoshan-chong',
  '上屋场': 'shangwuchang',
  '东山学堂': 'dongshan-school',
  '东山高等小学堂': 'dongshan-school',
  '东山书院': 'dongshan-school',
  '第一师范': 'hunan-yishi',
  '一师': 'hunan-yishi',
  '省立第一师范': 'hunan-yishi',
  '湖南第一师范': 'hunan-yishi',
  '井冈山': 'jinggangshan',
  '农讲所': 'nongmin-yundong-jiangxisuo',
  '遵义': 'zunyi',
  '遵义会议': 'zunyi',
  '赤水河': 'chishui',
  '四渡赤水': 'chishui',
  '泸定桥': 'ludingqiao',
  '大渡河': 'dadu-he',
  '安顺场': 'anshunchang',
  '夹金山': 'jiajinshan',
  '腊子口': 'lazikou',
  '哈达铺': 'hadapu',
  '吴起镇': 'wuqi',
  '六盘山': 'liupanshan',
  '草地': 'caodi',
  '松潘草地': 'caodi',
  '懋功': 'maogong',
  '皎平渡': 'jiaopingdu',
  '金沙江': 'jinshajiang',
  '乌江': 'wujiang',
  '清水塘': 'qingshuitang',
  '安源': 'anyuan',
  '安源煤矿': 'anyuan',
  '水口山': 'shuikoushan',
  '定王台': 'dingwangtai',
  '岳麓山': 'yuelushan',
  '岳麓书院': 'yuelu-shuyuan',
  '船山学社': 'chuanshan-shuyuan',
  '黄埔军校': 'huangpu-junxiao',
  '古田': 'gutian',
  '古田会议': 'gutian',
  '瑞金': 'ruijin',
  '茨坪': 'ciping',
  '茅坪': 'maoping',
  '三湾': 'sanwan',
  '三湾改编': 'sanwan',
  '文家市': 'wenjiashi',
  '大柏地': 'dabaidi',
  '东固': 'donggu',
  '富田': 'futian',
  '龙冈': 'longgang',
  '黄陂': 'huangpi',
  '娄山关': 'loushan-guan',
  '土城': 'tucheng',
  '会宁': 'huining',
  '瓦窑堡': 'wayaobao',
  '于都': 'yudu',
  '广昌': 'guangchang',
  '湘江战役': 'xiangjiang-zhanyi',
  '通道': 'tongdao',
  '黎平': 'liping',
  '会理': 'huili',
  '北京大学': 'beida',
  '北大': 'beida',
  '黄花岗': 'huanghuagang',
  '直罗镇': 'zhiluo',
});

// 按名称长度降序排列，避免短名误匹配
const SORTED_NAMES = Object.keys(NAME_TO_ID).sort((a, b) => b.length - a.length);

// =====================================================================
// 工具函数
// =====================================================================
function findMdxFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...findMdxFiles(full));
    else if (e.name.endsWith('.mdx')) results.push(full);
  }
  return results;
}

function extractBody(content) {
  const idx = content.indexOf('\n\n');
  return idx > -1 ? content.substring(idx + 2) : '';
}

function extractPlacesFromText(text) {
  const found = new Map(); // placeId -> { count, firstIndex }
  for (const name of SORTED_NAMES) {
    let searchFrom = 0;
    let count = 0;
    let firstIdx = -1;
    while (true) {
      const idx = text.indexOf(name, searchFrom);
      if (idx === -1) break;
      if (firstIdx === -1) firstIdx = idx;
      count++;
      searchFrom = idx + name.length;
    }
    if (count > 0) {
      const pid = NAME_TO_ID[name];
      if (!found.has(pid)) {
        found.set(pid, { count, firstIndex: firstIdx });
      } else {
        const existing = found.get(pid);
        existing.count += count;
        if (firstIdx < existing.firstIndex) existing.firstIndex = firstIdx;
      }
    }
  }
  return found;
}

function rankPlaces(foundMap) {
  const entries = [...foundMap.entries()];
  // Score = count * 2 + earlyBonus (earlier = higher)
  const maxIdx = Math.max(...entries.map(e => e[1].firstIndex), 1);
  entries.sort((a, b) => {
    const scoreA = a[1].count * 2 + (1 - a[1].firstIndex / maxIdx) * 3;
    const scoreB = b[1].count * 2 + (1 - b[1].firstIndex / maxIdx) * 3;
    return scoreB - scoreA;
  });
  return entries.map(e => e[0]);
}

// =====================================================================
// MAIN
// =====================================================================
const SKIP_CHAPTERS = new Set();
// Skip V01-C00 through V01-C03 (hand-written, already annotated)
for (let c = 0; c <= 3; c++) {
  const dir = path.join(CONTENT_BASE, 'v01', `c${String(c).padStart(2, '0')}`);
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));
    files.forEach(f => SKIP_CHAPTERS.add(f.replace('.mdx', '')));
  }
}

const allMdxFiles = findMdxFiles(CONTENT_BASE).sort();
const MAX_FEATURES = 5;
let updatedCount = 0;
const allUsedPlaceIds = new Set();

// First pass: collect existing place IDs from hand-written files
for (const f of allMdxFiles) {
  const name = path.basename(f, '.mdx');
  if (!SKIP_CHAPTERS.has(name)) continue;
  const content = fs.readFileSync(f, 'utf8');
  const metaMatch = content.match(/export\s+const\s+meta\s*=\s*(\{[\s\S]*?\n\})/);
  if (metaMatch) {
    try {
      const meta = new Function(`return ${metaMatch[1]}`)();
      if (meta.map && meta.map.features) {
        meta.map.features.forEach(feat => {
          if (feat.placeId) allUsedPlaceIds.add(feat.placeId);
        });
      }
    } catch (e) {}
  }
}

// Second pass: annotate auto-generated chapters
for (const f of allMdxFiles) {
  const name = path.basename(f, '.mdx');
  if (SKIP_CHAPTERS.has(name)) continue;

  const content = fs.readFileSync(f, 'utf8');
  const body = extractBody(content);
  if (!body.trim()) continue;

  const foundMap = extractPlacesFromText(body);
  if (foundMap.size === 0) {
    console.log(`  ${name}: no places found`);
    continue;
  }

  const ranked = rankPlaces(foundMap);
  const topPlaces = ranked.slice(0, MAX_FEATURES);

  topPlaces.forEach(pid => allUsedPlaceIds.add(pid));

  const features = topPlaces.map((pid, idx) => ({
    type: 'place',
    placeId: pid,
    label: PLACE_DEFS[pid]?.name || pid,
    role: idx === 0 ? 'primary' : 'context'
  }));

  // Build new meta.map
  const newMapObj = {
    features,
    route: null,
    camera: {
      mode: features.length > 1 ? 'autoFit' : 'preset',
      ...(features.length > 1
        ? { padding: 0.25, durationMs: 1500 }
        : {
            lng: PLACE_DEFS[topPlaces[0]]?.coord.lng || 112.9388,
            lat: PLACE_DEFS[topPlaces[0]]?.coord.lat || 28.2282,
            height: 50000,
            heading: 0,
            pitch: -45,
            durationMs: 1200
          })
    }
  };

  // Replace the map field in the meta
  const metaMatch = content.match(/export\s+const\s+meta\s*=\s*(\{[\s\S]*?\n\})/);
  if (!metaMatch) continue;

  try {
    const meta = new Function(`return ${metaMatch[1]}`)();
    meta.map = newMapObj;

    const newContent = `export const meta = ${JSON.stringify(meta, null, 2)}\n\n${body}`;
    fs.writeFileSync(f, newContent);
    updatedCount++;

    const placeNames = topPlaces.map(pid => PLACE_DEFS[pid]?.name || pid);
    console.log(`  ${name}: ${placeNames.join(', ')}`);
  } catch (e) {
    console.error(`  ${name}: ERROR - ${e.message}`);
  }
}

console.log(`\nUpdated ${updatedCount} MDX files`);

// Update places.json with all used place IDs
const existingPlaces = JSON.parse(fs.readFileSync(PLACES_JSON, 'utf8'));
const existingIds = new Set(existingPlaces.places.map(p => p.id));

let addedCount = 0;
for (const pid of allUsedPlaceIds) {
  if (!existingIds.has(pid) && PLACE_DEFS[pid]) {
    const def = PLACE_DEFS[pid];
    existingPlaces.places.push({
      id: pid,
      name: def.name,
      aliases: def.aliases || [],
      coord: def.coord,
      level: def.level || 'poi',
      notes: def.notes || '',
      source: { type: 'manual', by: 'auto-extract', date: new Date().toISOString().split('T')[0] }
    });
    addedCount++;
    console.log(`  + ${pid} (${def.name})`);
  }
}

existingPlaces.updatedAt = new Date().toISOString().split('T')[0];
const placesJson = JSON.stringify(existingPlaces, null, 2) + '\n';
fs.writeFileSync(PLACES_JSON, placesJson);
if (fs.existsSync(PLACES_JSON2)) {
  fs.writeFileSync(PLACES_JSON2, placesJson);
}
console.log(`\nAdded ${addedCount} new places to places.json (total: ${existingPlaces.places.length})`);
