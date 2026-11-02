// subscription-converter — Cloudflare Workers variant.
//
// A port of the VPS Python service (landing_server.py) to a single
// Worker. Behavioural parity target: the Python service's PRIMARY
// (own-skeleton) builders. The node-script fallback path and the
// templates/ fallback of the Python service are not portable to
// Workers and are intentionally absent (see README.md).
//
// Storage (KV binding "KV", always used):
//   link:<code>        JSON short-link record
//   idx:<sha256hex>    content identity index -> code
//   rule:<dst>         mirrored rule file bytes (manifest dst paths)
//   meta:rules_status  JSON of the last rules refresh
//
// Optional advanced bindings (used when present, KV stays the
// fallback so existing deployments keep working unchanged):
//   DB    (D1)   links table (records + content hash + hit counts)
//                and a refresh_log table
//   RULES (R2)   the rule mirror as objects under their dst paths;
//                reads try R2 first, then the KV copy
//
// The bundled skeletons (skeleton_clash.json / skeleton_singbox.json)
// carry the literal placeholder __PUBLIC_ORIGIN__ in their rule URLs;
// it is replaced at generation time with the origin of the incoming
// request, so generated configs always point back at this deployment.
import { load as yamlLoad, dump as yamlDump } from "js-yaml";
import skeletonClash from "./skeleton_clash.json" with { type: "json" };
import skeletonSingbox from "./skeleton_singbox.json" with { type: "json" };
import rulesManifest from "./rules_manifest.json" with { type: "json" };

const BROWSER_UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/126.0 Safari/537.36");
const REFRESH_UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36");
const GROUP_TYPES = new Set(["selector", "urltest"]);
const BUILTIN_TYPES = new Set(["direct", "block", "dns"]);
const ENTRY_AUTO = "⛓ 入口优选";
const EXIT_AUTO = "⛓ 出口优选";
const PLAIN_EXIT = "出口优选";

// Region definitions ported from the user's HiClash mihomoScript.js
// (regionDefinitions, 211 regions): [name, flag, regex source]. The
// grouping design follows the same script's createRegionGroup:
// each region that actually has nodes gets a "<名>-自动选择"
// url-test group plus a "<名>" select group holding the nodes and
// the auto group; unmatched nodes collect into "其他节点".
const REGION_DEFS = [
["香港","🇭🇰","🇭🇰|香港|\\bHKG?\\b|hong[\\s_-]*kong"],
["台湾","🇹🇼","🇹🇼|台湾|台北|高雄|新北|桃园|新竹|\\bTWN?\\b|taiwan|taipei|hinet"],
["日本","🇯🇵","🇯🇵|日本|\\bJPN?\\b|japan|tokyo|osaka|东京|大阪"],
["韩国","🇰🇷","🇰🇷|韩国|(?:^|[^A-Za-z])KR(?:$|[^A-Za-z])|korea|seoul|首尔"],
["新加坡","🇸🇬","🇸🇬|新加坡|狮城|\\bSGP?\\b|singapore"],
["美国","🇺🇸","🇺🇸|美国|(?:^|[^A-Za-z])US(?:$|[^A-Za-z])|(?:^|[^A-Za-z])USA(?:$|[^A-Za-z])|america|united[\\s_-]*states|los[\\s_-]*angeles|洛杉矶|san[\\s_-]*jose|圣何塞|纽约|new[\\s_-]*york|芝加哥|chicago|达拉斯|dallas|西雅图|seattle|硅谷|矽谷|silicon|迈阿密|miami|凤凰城|phoenix"],
["英国","🇬🇧","🇬🇧|英国|(?:^|[^A-Za-z0-9])GB(?:$|[^A-Za-z])|united[\\s_-]*kingdom|london|伦敦"],
["德国","🇩🇪","🇩🇪|德国|(?:^|[^A-Za-z])DE(?:$|[^A-Za-z])|germany|frankfurt|法兰克福"],
["荷兰","🇳🇱","🇳🇱|荷兰|(?:^|[^A-Za-z])NL(?:$|[^A-Za-z])|nether?lands|amsterdam|阿姆斯特丹"],
["马来西亚","🇲🇾","🇲🇾|马来西亚|(?:^|[^A-Za-z])MY(?:$|[^A-Za-z])|malaysia|kuala[\\s_-]*lumpur|吉隆坡"],
["泰国","🇹🇭","🇹🇭|泰国|(?:^|[^A-Za-z])TH(?:$|[^A-Za-z])|thailand|bangkok|曼谷"],
["越南","🇻🇳","🇻🇳|越南|(?:^|[^A-Za-z])VN(?:$|[^A-Za-z])|vietnam|hanoi|河内|ho[\\s_-]*chi[\\s_-]*minh|胡志明"],
["菲律宾","🇵🇭","🇵🇭|菲律宾|(?:^|[^A-Za-z])PH(?:$|[^A-Za-z])|philippines|manila|马尼拉"],
["印尼","🇮🇩","🇮🇩|印尼|印度尼西亚|(?:^|[^A-Za-z])ID(?:$|[^A-Za-z])|indonesia|jakarta|雅加达"],
["印度","🇮🇳","🇮🇳|印度|(?:^|[^A-Za-z])IN(?:$|[^A-Za-z])|india|mumbai|孟买|delhi|德里"],
["澳大利亚","🇦🇺","🇦🇺|澳大利亚|澳洲|(?:^|[^A-Za-z])AU(?:$|[^A-Za-z])|australia|sydney|悉尼|melbourne|墨尔本"],
["法国","🇫🇷","🇫🇷|法国|(?:^|[^A-Za-z])FR(?:$|[^A-Za-z])|france|paris|巴黎"],
["俄罗斯","🇷🇺","🇷🇺|俄罗斯|(?:^|[^A-Za-z])RU(?:$|[^A-Za-z])|russia|moscow|莫斯科"],
["意大利","🇮🇹","🇮🇹|意大利|(?:^|[^A-Za-z])IT(?:$|[^A-Za-z])|\\bitaly\\b|rome|罗马"],
["加拿大","🇨🇦","🇨🇦|加拿大|(?:^|[^A-Za-z])CA(?:$|[^A-Za-z])|canada|toronto|多伦多"],
["阿根廷","🇦🇷","🇦🇷|阿根廷|(?:^|[^A-Za-z])AR(?:$|[^A-Za-z])|argentina|buenos[\\s_-]*aires|布宜诺斯艾利斯"],
["巴西","🇧🇷","🇧🇷|巴西|(?:^|[^A-Za-z])BR(?:$|[^A-Za-z])|brazil|sao[\\s_-]*paulo|圣保罗"],
["墨西哥","🇲🇽","🇲🇽|墨西哥|(?:^|[^A-Za-z])MX(?:$|[^A-Za-z])|mexico"],
["沙特阿拉伯","🇸🇦","🇸🇦|沙特阿拉伯|沙特|(?:^|[^A-Za-z])SA(?:$|[^A-Za-z])|saudi[\\s_-]*arabia"],
["南非","🇿🇦","🇿🇦|南非|(?:^|[^A-Za-z])ZA(?:$|[^A-Za-z])|south[\\s_-]*africa|johannesburg|约翰内斯堡"],
["土耳其","🇹🇷","🇹🇷|土耳其|(?:^|[^A-Za-z])TR(?:$|[^A-Za-z])|turkey|istanbul|伊斯坦布尔"],
["文莱","🇧🇳","🇧🇳|文莱|(?:^|[^A-Za-z])BN(?:$|[^A-Za-z])|brunei"],
["柬埔寨","🇰🇭","🇰🇭|柬埔寨|(?:^|[^A-Za-z])KH(?:$|[^A-Za-z])|cambodia|phnom[\\s_-]*penh|金边"],
["老挝","🇱🇦","🇱🇦|老挝|(?:^|[^A-Za-z])LA(?:$|[^A-Za-z])|\\blaos\\b|vientiane|万象"],
["缅甸","🇲🇲","🇲🇲|缅甸|(?:^|[^A-Za-z])MM(?:$|[^A-Za-z])|myanmar|yangon|仰光"],
["奥地利","🇦🇹","🇦🇹|奥地利|(?:^|[^A-Za-z])AT(?:$|[^A-Za-z])|austria|vienna|维也纳"],
["比利时","🇧🇪","🇧🇪|比利时|(?:^|[^A-Za-z])BE(?:$|[^A-Za-z])|belgium|brussels|布鲁塞尔"],
["保加利亚","🇧🇬","🇧🇬|保加利亚|(?:^|[^A-Za-z])BG(?:$|[^A-Za-z])|bulgaria|sofia|索非亚"],
["克罗地亚","🇭🇷","🇭🇷|克罗地亚|(?:^|[^A-Za-z])HR(?:$|[^A-Za-z])|croatia"],
["塞浦路斯","🇨🇾","🇨🇾|塞浦路斯|(?:^|[^A-Za-z])CY(?:$|[^A-Za-z])|cyprus"],
["捷克","🇨🇿","🇨🇿|捷克|捷克共和国|(?:^|[^A-Za-z])CZ(?:$|[^A-Za-z])|czech|prague|布拉格"],
["丹麦","🇩🇰","🇩🇰|丹麦|(?:^|[^A-Za-z])DK(?:$|[^A-Za-z])|denmark|copenhagen|哥本哈根"],
["爱沙尼亚","🇪🇪","🇪🇪|爱沙尼亚|(?:^|[^A-Za-z])EE(?:$|[^A-Za-z])|estonia"],
["芬兰","🇫🇮","🇫🇮|芬兰|(?:^|[^A-Za-z])FI(?:$|[^A-Za-z])|finland|helsinki|赫尔辛基"],
["希腊","🇬🇷","🇬🇷|希腊|(?:^|[^A-Za-z])GR(?:$|[^A-Za-z])|greece|athens|雅典"],
["匈牙利","🇭🇺","🇭🇺|匈牙利|(?:^|[^A-Za-z])HU(?:$|[^A-Za-z])|hungary|budapest|布达佩斯"],
["爱尔兰","🇮🇪","🇮🇪|爱尔兰|(?:^|[^A-Za-z])IE(?:$|[^A-Za-z])|ireland|dublin|都柏林"],
["拉脱维亚","🇱🇻","🇱🇻|拉脱维亚|(?:^|[^A-Za-z])LV(?:$|[^A-Za-z])|latvia"],
["立陶宛","🇱🇹","🇱🇹|立陶宛|(?:^|[^A-Za-z])LT(?:$|[^A-Za-z])|lithuania"],
["卢森堡","🇱🇺","🇱🇺|卢森堡|(?:^|[^A-Za-z])LU(?:$|[^A-Za-z])|luxembourg"],
["马耳他","🇲🇹","🇲🇹|马耳他|(?:^|[^A-Za-z])MT(?:$|[^A-Za-z])|malta"],
["波兰","🇵🇱","🇵🇱|波兰|(?:^|[^A-Za-z])PL(?:$|[^A-Za-z])|poland|warsaw|华沙"],
["葡萄牙","🇵🇹","🇵🇹|葡萄牙|(?:^|[^A-Za-z])PT(?:$|[^A-Za-z])|portugal|lisbon|里斯本"],
["罗马尼亚","🇷🇴","🇷🇴|罗马尼亚|(?:^|[^A-Za-z])RO(?:$|[^A-Za-z])|romania|bucharest|布加勒斯特"],
["斯洛伐克","🇸🇰","🇸🇰|斯洛伐克|(?:^|[^A-Za-z])SK(?:$|[^A-Za-z])|slovakia"],
["斯洛文尼亚","🇸🇮","🇸🇮|斯洛文尼亚|(?:^|[^A-Za-z])SI(?:$|[^A-Za-z])|slovenia"],
["西班牙","🇪🇸","🇪🇸|西班牙|(?:^|[^A-Za-z])ES(?:$|[^A-Za-z])|\\bspain\\b|madrid|马德里"],
["瑞典","🇸🇪","🇸🇪|瑞典|(?:^|[^A-Za-z])SE(?:$|[^A-Za-z])|sweden|stockholm|斯德哥尔摩"],
["阿尔及利亚","🇩🇿","🇩🇿|阿尔及利亚|(?:^|[^A-Za-z])DZ(?:$|[^A-Za-z])|algeria"],
["安哥拉","🇦🇴","🇦🇴|安哥拉|(?:^|[^A-Za-z])AO(?:$|[^A-Za-z])|angola"],
["贝宁","🇧🇯","🇧🇯|贝宁|(?:^|[^A-Za-z])BJ(?:$|[^A-Za-z])|benin"],
["博茨瓦纳","🇧🇼","🇧🇼|博茨瓦纳|(?:^|[^A-Za-z])BW(?:$|[^A-Za-z])|botswana"],
["布基纳法索","🇧🇫","🇧🇫|布基纳法索|(?:^|[^A-Za-z])BF(?:$|[^A-Za-z])|burkina[\\s_-]*faso"],
["布隆迪","🇧🇮","🇧🇮|布隆迪|(?:^|[^A-Za-z])BI(?:$|[^A-Za-z])|burundi"],
["佛得角","🇨🇻","🇨🇻|佛得角|(?:^|[^A-Za-z])CV(?:$|[^A-Za-z])|cabo[\\s_-]*verde|cape[\\s_-]*verde"],
["喀麦隆","🇨🇲","🇨🇲|喀麦隆|(?:^|[^A-Za-z])CM(?:$|[^A-Za-z])|cameroon"],
["中非共和国","🇨🇫","🇨🇫|中非共和国|中非|(?:^|[^A-Za-z])CF(?:$|[^A-Za-z])|central[\\s_-]*african"],
["乍得","🇹🇩","🇹🇩|乍得|(?:^|[^A-Za-z])TD(?:$|[^A-Za-z])|\\bchad\\b"],
["科摩罗","🇰🇲","🇰🇲|科摩罗|(?:^|[^A-Za-z])KM(?:$|[^A-Za-z])|comoros"],
["刚果共和国","🇨🇬","🇨🇬|刚果共和国|刚果（布）|(?:^|[^A-Za-z])CG(?:$|[^A-Za-z])|\\bcongo\\b"],
["刚果民主共和国","🇨🇩","🇨🇩|刚果民主共和国|刚果（金）|民主刚果|(?:^|[^A-Za-z])CD(?:$|[^A-Za-z])|dr[\\s_-]*congo|democratic[\\s_-]*republic[\\s_-]*of[\\s_-]*the[\\s_-]*congo"],
["科特迪瓦","🇨🇮","🇨🇮|科特迪瓦|象牙海岸|(?:^|[^A-Za-z])CI(?:$|[^A-Za-z])|cote[\\s_-]*d.ivoire|ivory[\\s_-]*coast"],
["吉布提","🇩🇯","🇩🇯|吉布提|(?:^|[^A-Za-z])DJ(?:$|[^A-Za-z])|djibouti"],
["埃及","🇪🇬","🇪🇬|埃及|(?:^|[^A-Za-z])EG(?:$|[^A-Za-z])|egypt|cairo|开罗"],
["赤道几内亚","🇬🇶","🇬🇶|赤道几内亚|(?:^|[^A-Za-z])GQ(?:$|[^A-Za-z])|equatorial[\\s_-]*guinea"],
["厄立特里亚","🇪🇷","🇪🇷|厄立特里亚|(?:^|[^A-Za-z])ER(?:$|[^A-Za-z])|eritrea"],
["斯威士兰","🇸🇿","🇸🇿|斯威士兰|埃斯瓦蒂尼|(?:^|[^A-Za-z])SZ(?:$|[^A-Za-z])|eswatini|swaziland"],
["埃塞俄比亚","🇪🇹","🇪🇹|埃塞俄比亚|(?:^|[^A-Za-z])ET(?:$|[^A-Za-z])|ethiopia"],
["加蓬","🇬🇦","🇬🇦|加蓬|(?:^|[^A-Za-z])GA(?:$|[^A-Za-z])|\\bgabon\\b"],
["冈比亚","🇬🇲","🇬🇲|冈比亚|(?:^|[^A-Za-z])GM(?:$|[^A-Za-z])|gambia"],
["加纳","🇬🇭","🇬🇭|加纳|(?:^|[^A-Za-z])GH(?:$|[^A-Za-z])|\\bghana\\b"],
["几内亚","🇬🇳","🇬🇳|几内亚|(?:^|[^A-Za-z])GN(?:$|[^A-Za-z])|\\bguinea\\b"],
["几内亚比绍","🇬🇼","🇬🇼|几内亚比绍|(?:^|[^A-Za-z])GW(?:$|[^A-Za-z])|guinea-bissau|guinea[\\s_-]*bissau"],
["肯尼亚","🇰🇪","🇰🇪|肯尼亚|(?:^|[^A-Za-z])KE(?:$|[^A-Za-z])|kenya|nairobi|内罗毕"],
["莱索托","🇱🇸","🇱🇸|莱索托|(?:^|[^A-Za-z])LS(?:$|[^A-Za-z])|lesotho"],
["利比里亚","🇱🇷","🇱🇷|利比里亚|(?:^|[^A-Za-z])LR(?:$|[^A-Za-z])|liberia"],
["利比亚","🇱🇾","🇱🇾|利比亚|(?:^|[^A-Za-z])LY(?:$|[^A-Za-z])|\\blibya\\b"],
["马达加斯加","🇲🇬","🇲🇬|马达加斯加|(?:^|[^A-Za-z])MG(?:$|[^A-Za-z])|madagascar"],
["马拉维","🇲🇼","🇲🇼|马拉维|(?:^|[^A-Za-z])MW(?:$|[^A-Za-z])|malawi"],
["马里","🇲🇱","🇲🇱|马里|(?:^|[^A-Za-z])ML(?:$|[^A-Za-z])|\\bmali\\b"],
["毛里塔尼亚","🇲🇷","🇲🇷|毛里塔尼亚|(?:^|[^A-Za-z])MR(?:$|[^A-Za-z])|mauritania"],
["毛里求斯","🇲🇺","🇲🇺|毛里求斯|(?:^|[^A-Za-z])MU(?:$|[^A-Za-z])|mauritius"],
["摩洛哥","🇲🇦","🇲🇦|摩洛哥|(?:^|[^A-Za-z])MA(?:$|[^A-Za-z])|morocco|casablanca|卡萨布兰卡"],
["莫桑比克","🇲🇿","🇲🇿|莫桑比克|(?:^|[^A-Za-z])MZ(?:$|[^A-Za-z])|mozambique"],
["纳米比亚","🇳🇦","🇳🇦|纳米比亚|(?:^|[^A-Za-z])NA(?:$|[^A-Za-z])|\\bnamibia\\b"],
["尼日尔","🇳🇪","🇳🇪|尼日尔|(?:^|[^A-Za-z])NE(?:$|[^A-Za-z])|\\bniger\\b"],
["尼日利亚","🇳🇬","🇳🇬|尼日利亚|(?:^|[^A-Za-z])NG(?:$|[^A-Za-z])|nigeria|lagos|拉各斯"],
["卢旺达","🇷🇼","🇷🇼|卢旺达|(?:^|[^A-Za-z])RW(?:$|[^A-Za-z])|rwanda"],
["圣多美和普林西比","🇸🇹","🇸🇹|圣多美和普林西比|(?:^|[^A-Za-z])ST(?:$|[^A-Za-z])|sao[\\s_-]*tome"],
["塞内加尔","🇸🇳","🇸🇳|塞内加尔|(?:^|[^A-Za-z])SN(?:$|[^A-Za-z])|senegal"],
["塞舌尔","🇸🇨","🇸🇨|塞舌尔|(?:^|[^A-Za-z])SC(?:$|[^A-Za-z])|seychelles"],
["塞拉利昂","🇸🇱","🇸🇱|塞拉利昂|(?:^|[^A-Za-z])SL(?:$|[^A-Za-z])|sierra[\\s_-]*leone"],
["索马里","🇸🇴","🇸🇴|索马里|(?:^|[^A-Za-z])SO(?:$|[^A-Za-z])|somalia"],
["南苏丹","🇸🇸","🇸🇸|南苏丹|(?:^|[^A-Za-z])SS(?:$|[^A-Za-z])|south[\\s_-]*sudan"],
["苏丹","🇸🇩","🇸🇩|苏丹|(?:^|[^A-Za-z])SD(?:$|[^A-Za-z])|\\bsudan\\b"],
["坦桑尼亚","🇹🇿","🇹🇿|坦桑尼亚|(?:^|[^A-Za-z])TZ(?:$|[^A-Za-z])|tanzania"],
["多哥","🇹🇬","🇹🇬|多哥|(?:^|[^A-Za-z])TG(?:$|[^A-Za-z])|\\btogo\\b"],
["突尼斯","🇹🇳","🇹🇳|突尼斯|(?:^|[^A-Za-z])TN(?:$|[^A-Za-z])|tunisia"],
["乌干达","🇺🇬","🇺🇬|乌干达|(?:^|[^A-Za-z])UG(?:$|[^A-Za-z])|uganda"],
["赞比亚","🇿🇲","🇿🇲|赞比亚|(?:^|[^A-Za-z])ZM(?:$|[^A-Za-z])|zambia"],
["津巴布韦","🇿🇼","🇿🇼|津巴布韦|(?:^|[^A-Za-z])ZW(?:$|[^A-Za-z])|zimbabwe"],
["阿富汗","🇦🇫","🇦🇫|阿富汗|afghanistan"],
["亚美尼亚","🇦🇲","🇦🇲|亚美尼亚|armenia"],
["阿塞拜疆","🇦🇿","🇦🇿|阿塞拜疆|azerbaijan"],
["巴林","🇧🇭","🇧🇭|巴林|bahrain"],
["孟加拉国","🇧🇩","🇧🇩|孟加拉国|bangladesh"],
["不丹","🇧🇹","🇧🇹|不丹|bhutan"],
["格鲁吉亚","🇬🇪","🇬🇪|格鲁吉亚|georgia"],
["伊朗","🇮🇷","🇮🇷|伊朗|iran"],
["伊拉克","🇮🇶","🇮🇶|伊拉克|iraq"],
["以色列","🇮🇱","🇮🇱|以色列|israel"],
["约旦","🇯🇴","🇯🇴|约旦|jordan"],
["哈萨克斯坦","🇰🇿","🇰🇿|哈萨克斯坦|kazakhstan"],
["科威特","🇰🇼","🇰🇼|科威特|kuwait"],
["吉尔吉斯斯坦","🇰🇬","🇰🇬|吉尔吉斯斯坦|kyrgyzstan"],
["黎巴嫩","🇱🇧","🇱🇧|黎巴嫩|lebanon"],
["马尔代夫","🇲🇻","🇲🇻|马尔代夫|maldives"],
["蒙古","🇲🇳","🇲🇳|蒙古|mongolia"],
["尼泊尔","🇳🇵","🇳🇵|尼泊尔|nepal"],
["朝鲜","🇰🇵","🇰🇵|朝鲜|north[\\s_-]*korea|dprk"],
["阿曼","🇴🇲","🇴🇲|阿曼|oman"],
["巴基斯坦","🇵🇰","🇵🇰|巴基斯坦|pakistan"],
["巴勒斯坦","🇵🇸","🇵🇸|巴勒斯坦|palestine|west[\\s_-]*bank|gaza"],
["卡塔尔","🇶🇦","🇶🇦|卡塔尔|qatar"],
["斯里兰卡","🇱🇰","🇱🇰|斯里兰卡|sri[\\s_-]*lanka"],
["叙利亚","🇸🇾","🇸🇾|叙利亚|syria"],
["塔吉克斯坦","🇹🇯","🇹🇯|塔吉克斯坦|tajikistan"],
["东帝汶","🇹🇱","🇹🇱|东帝汶|timor[\\s_-]*leste|east[\\s_-]*timor"],
["土库曼斯坦","🇹🇲","🇹🇲|土库曼斯坦|turkmenistan"],
["阿联酋","🇦🇪","🇦🇪|阿联酋|迪拜|阿布扎比|dubai|abu[s_-]*dhabi|uae|united[\\s_-]*arab[\\s_-]*emirates"],
["乌兹别克斯坦","🇺🇿","🇺🇿|乌兹别克斯坦|uzbekistan"],
["也门","🇾🇪","🇾🇪|也门|yemen"],
["澳门","🇲🇴","🇲🇴|澳门|macau|macao"],
["阿尔巴尼亚","🇦🇱","🇦🇱|阿尔巴尼亚|albania"],
["安道尔","🇦🇩","🇦🇩|安道尔|andorra"],
["白俄罗斯","🇧🇾","🇧🇾|白俄罗斯|belarus"],
["波斯尼亚和黑塞哥维那","🇧🇦","🇧🇦|波斯尼亚和黑塞哥维那|bosnia|bosnia[\\s_-]*and[\\s_-]*herzegovina"],
["冰岛","🇮🇸","🇮🇸|冰岛|iceland"],
["列支敦士登","🇱🇮","🇱🇮|列支敦士登|liechtenstein"],
["摩尔多瓦","🇲🇩","🇲🇩|摩尔多瓦|moldova"],
["摩纳哥","🇲🇨","🇲🇨|摩纳哥|monaco"],
["黑山","🇲🇪","🇲🇪|黑山|montenegro"],
["北马其顿","🇲🇰","🇲🇰|北马其顿|north[\\s_-]*macedonia|macedonia"],
["挪威","🇳🇴","🇳🇴|挪威|norway"],
["圣马力诺","🇸🇲","🇸🇲|圣马力诺|san[\\s_-]*marino"],
["塞尔维亚","🇷🇸","🇷🇸|塞尔维亚|serbia"],
["瑞士","🇨🇭","🇨🇭|瑞士|switzerland"],
["乌克兰","🇺🇦","🇺🇦|乌克兰|ukraine"],
["梵蒂冈","🇻🇦","🇻🇦|梵蒂冈|vatican"],
["科索沃","🇽🇰","🇽🇰|科索沃|kosovo"],
["巴哈马","🇧🇸","🇧🇸|巴哈马|bahamas"],
["巴巴多斯","🇧🇧","🇧🇧|巴巴多斯|barbados"],
["伯利兹","🇧🇿","🇧🇿|伯利兹|belize"],
["哥斯达黎加","🇨🇷","🇨🇷|哥斯达黎加|costa[\\s_-]*rica"],
["古巴","🇨🇺","🇨🇺|古巴|cuba"],
["多米尼克","🇩🇲","🇩🇲|多米尼克|dominica"],
["多米尼加","🇩🇴","🇩🇴|多米尼加|dominican[\\s_-]*republic|dominican"],
["萨尔瓦多","🇸🇻","🇸🇻|萨尔瓦多|el[\\s_-]*salvador"],
["格林纳达","🇬🇩","🇬🇩|格林纳达|grenada"],
["危地马拉","🇬🇹","🇬🇹|危地马拉|guatemala"],
["海地","🇭🇹","🇭🇹|海地|haiti"],
["洪都拉斯","🇭🇳","🇭🇳|洪都拉斯|honduras"],
["牙买加","🇯🇲","🇯🇲|牙买加|jamaica"],
["尼加拉瓜","🇳🇮","🇳🇮|尼加拉瓜|nicaragua"],
["巴拿马","🇵🇦","🇵🇦|巴拿马|panama"],
["圣基茨和尼维斯","🇰🇳","🇰🇳|圣基茨和尼维斯|saint[\\s_-]*kitts|st[\\s_-]*kitts"],
["圣卢西亚","🇱🇨","🇱🇨|圣卢西亚|saint[\\s_-]*lucia|st[\\s_-]*lucia"],
["圣文森特和格林纳丁斯","🇻🇨","🇻🇨|圣文森特和格林纳丁斯|saint[\\s_-]*vincent|st[\\s_-]*vincent"],
["特立尼达和多巴哥","🇹🇹","🇹🇹|特立尼达和多巴哥|trinidad[\\s_-]*and[\\s_-]*tobago"],
["安提瓜和巴布达","🇦🇬","🇦🇬|安提瓜和巴布达|antigua[\\s_-]*and[\\s_-]*barbuda"],
["哥伦比亚","🇨🇴","🇨🇴|哥伦比亚|波哥大|麦德林|(?:^|[^A-Za-z])CO(?:$|[^A-Za-z])|bogot[aá]|medellin|colombia"],
["智利","🇨🇱","🇨🇱|智利|chile"],
["秘鲁","🇵🇪","🇵🇪|秘鲁|peru"],
["乌拉圭","🇺🇾","🇺🇾|乌拉圭|uruguay"],
["巴拉圭","🇵🇾","🇵🇾|巴拉圭|paraguay"],
["玻利维亚","🇧🇴","🇧🇴|玻利维亚|bolivia"],
["厄瓜多尔","🇪🇨","🇪🇨|厄瓜多尔|ecuador"],
["委内瑞拉","🇻🇪","🇻🇪|委内瑞拉|venezuela"],
["圭亚那","🇬🇾","🇬🇾|圭亚那|guyana"],
["苏里南","🇸🇷","🇸🇷|苏里南|suriname"],
["新西兰","🇳🇿","🇳🇿|新西兰|new[\\s_-]*zealand|auckland|奥克兰|wellington|惠灵顿"],
["斐济","🇫🇯","🇫🇯|斐济|fiji"],
["巴布亚新几内亚","🇵🇬","🇵🇬|巴布亚新几内亚|papua[\\s_-]*new[\\s_-]*guinea"],
["所罗门群岛","🇸🇧","🇸🇧|所罗门群岛|solomon[\\s_-]*islands"],
["瓦努阿图","🇻🇺","🇻🇺|瓦努阿图|vanuatu"],
["萨摩亚","🇼🇸","🇼🇸|萨摩亚|samoa"],
["汤加","🇹🇴","🇹🇴|汤加|tonga"],
["基里巴斯","🇰🇮","🇰🇮|基里巴斯|kiribati"],
["图瓦卢","🇹🇻","🇹🇻|图瓦卢|tuvalu"],
["瑙鲁","🇳🇷","🇳🇷|瑙鲁|nauru"],
["帕劳","🇵🇼","🇵🇼|帕劳|palau"],
["马绍尔群岛","🇲🇭","🇲🇭|马绍尔群岛|marshall[\\s_-]*islands"],
["密克罗尼西亚","🇫🇲","🇫🇲|密克罗尼西亚|micronesia|federated[\\s_-]*states[\\s_-]*of[\\s_-]*micronesia"],
["关岛","🇬🇺","🇬🇺|关岛|guam"],
["波多黎各","🇵🇷","🇵🇷|波多黎各|puerto[\\s_-]*rico"],
["百慕大","🇧🇲","🇧🇲|百慕大|bermuda"],
["格陵兰","🇬🇱","🇬🇱|格陵兰|greenland"],
["库拉索","🇨🇼","🇨🇼|库拉索|curacao|curaçao"],
["阿鲁巴","🇦🇼","🇦🇼|阿鲁巴|aruba"],
["开曼群岛","🇰🇾","🇰🇾|开曼群岛|cayman[\\s_-]*islands"],
["英属维尔京群岛","🇻🇬","🇻🇬|英属维尔京群岛|british[\\s_-]*virgin[\\s_-]*islands"],
["美属维尔京群岛","🇻🇮","🇻🇮|美属维尔京群岛|us[\\s_-]*virgin[\\s_-]*islands|u\\.s\\.[\\s_-]*virgin[\\s_-]*islands"],
["新喀里多尼亚","🇳🇨","🇳🇨|新喀里多尼亚|new[\\s_-]*caledonia"],
["法属波利尼西亚","🇵🇫","🇵🇫|法属波利尼西亚|french[\\s_-]*polynesia"],
["库克群岛","🇨🇰","🇨🇰|库克群岛|cook[\\s_-]*islands"],
["纽埃","🇳🇺","🇳🇺|纽埃|niue"]
];
const REGION_RES = REGION_DEFS.map(([name, , src]) => [name, new RegExp(src, "i")]);
// Strong info words (airport notices etc.) never prove a region,
// even when the name happens to contain a region code (HiClash
// strongExcludeFilter).
const STRONG_INFO =
  /剩余|已用|距离下次|下次重置|套餐|到期|过期|官网|官址|客服|订阅|工单|邮箱|网址|流量\s*[:：]|traffic\s*[:：]|\bexpire\b|\bhttps?:\/\/|t\.me\//iu;
// Full info-node filter (HiClash excludeFilter): names matching it
// are dropped from plain conversions unless they match a region.
const EXCLUDE_FILTER = new RegExp("\u7fa4|\u8fd4\u5229|\u5faa\u73af|\u5b98\u7f51|\u5ba2\u670d|\u7f51\u7ad9|\u7f51\u5740|\u83b7\u53d6|\u8ba2\u9605|\u6d41\u91cf|\u5230\u671f|\u673a\u573a|\u4e0b\u6b21|\u7248\u672c|\u5b98\u5740|\u5907\u7528|\u8fc7\u671f|\u5df2\u7528|\u8054\u7cfb|\u90ae\u7bb1|\u5de5\u5355|\u8d29\u5356|\u901a\u77e5|\u5012\u5356|\u9632\u6b62|\u56fd\u5185|\u5730\u5740|\u9891\u9053|\u7535\u62a5|\u65e0\u6cd5|\u8bf4\u660e|\u4f7f\u7528|\u63d0\u793a|\u8bbf\u95ee|\u652f\u6301|\u6559\u7a0b|\u5173\u6ce8|\u66f4\u65b0|\u4f5c\u8005|\u52a0\u5165|\u8d85\u65f6|\u6536\u85cf|\u4f18\u60e0|\u798f\u5229|\u9080\u8bf7|\u597d\u53cb|\u5931\u8054|\u9009\u62e9|\u5269\u4f59|\u516c\u76ca|\u53d1\u5e03|DIZTNA|\u901a\u8def|\u767b\u5f55|\u7981\u6b62|\u5b9a\u65f6|\u6e20\u9053|\u7262\u8bb0|\u6c38\u4e45|\u4f59\u989d|\u9601\u4e0b|\u672c\u7ad9|\u5237\u65b0|\u5bfc\u822a|\u5efa\u8bae|\u91cd\u7f6e|\u4ee5\u4e0b|\u8fc7\u6ee4|\u26a0\ufe0f|@|t\\.me\\/\\+|\\bexpire\\b|\\bhttps?:\\/\\/|\\btraffic\\b", "iu");
// Traditional → Simplified folding for region matching only (names
// themselves are never rewritten), ported from the script's
// traditionalToSimplified map: airport names often use Traditional
// forms while the region regexes are Simplified.
const TRAD2SIMP = {
  "灣": "湾", "國": "国", "臺": "台", "東": "东", "島": "岛",
  "亞": "亚", "倫": "伦", "蘭": "兰", "馬": "马", "賓": "宾",
  "紐": "纽", "約": "约", "達": "达", "磯": "矶", "聖": "圣",
  "門": "门", "韓": "韩", "羅": "罗", "蘇": "苏", "聯": "联",
  "愛": "爱", "爾": "尔", "烏": "乌", "薩": "萨", "華": "华",
  "頓": "顿", "維": "维", "緬": "缅", "廣": "广",
};
const TRAD_RE = new RegExp(`[${Object.keys(TRAD2SIMP).join("")}]`, "g");
function foldTrad(text) {
  return String(text).replace(TRAD_RE, (ch) => TRAD2SIMP[ch]);
}
// Rate / residential pseudo-regions (HiClash rateRegionDefinitions +
// homeRegionDefinitions): a node may join one of these IN ADDITION
// to its geographic region.
const ICON_BASE =
  "https://fastly.jsdelivr.net/gh/dukangalex/HiClash@assets-v1/Icons/svg/";
const EXTRA_DEFS = [
  { name: "低倍率节点", icon: ICON_BASE + "Available.svg",
    re: new RegExp("^(?!.*(?:\u5269|\u671f)).*(?:(?<!\\d)0\\.[0-5]|(?<=[ \\[\\(|\uff5c\u4e28\u2223\u2503\\-\u2010\u2013\u2014\u2212\uff0d\ufe63])0[*\u00d7\u2715\u2716\u2a2f\u2a09x\u500d])|(?:(?<=[ \\[\\(|\uff5c\u4e28\u2223\u2503\\-\u2010\u2013\u2014\u2212\uff0d\ufe63])[*\u00d7\u2715\u2716\u2a2f\u2a09x]0(?=[ \\)\\]]|\u500d|$))|^(?!.*(?:\u5ba2\u6237\u7aef|\u8f6f\u4ef6)).*\u4e0b\u8f7d|\u4f4e\u500d|\u514d\u8d39|(?<![A-Za-z])free(?![A-Za-z])", "i") },
  { name: "高倍率节点", icon: ICON_BASE + "Airport.svg",
    re: new RegExp("(?<=[ \\[\\(|\uff5c\u4e28\u2223\u2503\\-\u2010\u2013\u2014\u2212\uff0d\ufe63])((?:[*\u00d7\u2715\u2716\u2a2f\u2a09x]\\s*(?:[2-9]\\d*|[1-9]\\d+)(?:\\.\\d+)?)|(?:(?<![\\d.])(?:[2-9]\\d*|[1-9]\\d+)(?:\\.\\d+)?\\s*(?:\u500d|[*\u00d7\u2715\u2716\u2a2f\u2a09x])))", "i") },
  { name: "家宽节点", icon: ICON_BASE + "Server.svg",
    re: new RegExp("\u5bb6\u5bbd|\u4f4f\u5b85|\u539f\u751f\\s*IP|\u5bb6\u5ead\u5bbd\u5e26|\\bISP\\b|\\bRES\\b|residential", "i") },
];
const AUTO_ICON = ICON_BASE + "Auto.svg";
const OTHER_ICON = ICON_BASE + "WorldMap.svg";
// Region assignment follows the script's getMatchedRegions: matches
// are computed on the folded name; when several geographic regions
// match, only the longest match(es) win. Rate / home matches are
// independent and always kept.
function matchedRegions(name) {
  const text = foldTrad(name);
  let best = -1;
  const hits = [];
  for (let i = 0; i < REGION_RES.length; i++) {
    const m = text.match(REGION_RES[i][1]);
    if (m) {
      hits.push([i, m[0].length]);
      if (m[0].length > best) best = m[0].length;
    }
  }
  const geo = hits.filter(([, len]) => len === best).map(([i]) => i);
  const extras = [];
  for (let i = 0; i < EXTRA_DEFS.length; i++) {
    if (EXTRA_DEFS[i].re.test(text)) extras.push(i);
  }
  return { geo, extras };
}
// Ordered region pairs for a node list: geographic pairs in
// definition order, then rate / home pairs, then the catch-all
// "其他节点" pair for nodes with no geographic match. Strong info
// names join no pair at all.
function regionPlan(names) {
  const buckets = new Map();
  const add = (key, pname, icon, n) => {
    if (!buckets.has(key)) {
      buckets.set(key, { name: pname, icon, members: [] });
    }
    buckets.get(key).members.push(n);
  };
  const matched = new Set();
  for (const n of names) {
    if (STRONG_INFO.test(n)) continue;
    const { geo, extras } = matchedRegions(n);
    for (const i of geo) add("g" + i, REGION_DEFS[i][0], "", n);
    for (const i of extras) add("x" + i, EXTRA_DEFS[i].name, EXTRA_DEFS[i].icon, n);
    if (geo.length) matched.add(n);
  }
  const pairs = [];
  for (let i = 0; i < REGION_DEFS.length; i++) {
    const b = buckets.get("g" + i);
    if (b) pairs.push(b);
  }
  for (let i = 0; i < EXTRA_DEFS.length; i++) {
    const b = buckets.get("x" + i);
    if (b) pairs.push(b);
  }
  const other = names.filter(
    (n) => !matched.has(n) && !STRONG_INFO.test(n));
  if (other.length) {
    pairs.push({ name: "其他节点", icon: OTHER_ICON, members: other });
  }
  const selectNames = pairs.map((q) => q.name);
  const pairNames = [];
  for (const q of pairs) pairNames.push(q.name + "-自动选择", q.name);
  return { pairs, selectNames, pairNames };
}
// The script's node filter for plain conversions: strong info names
// are dropped outright; other info-style names are dropped unless
// they match a region; real nodes always pass.
function keepPlainNode(name) {
  if (STRONG_INFO.test(name)) return false;
  if (matchedRegions(name).geo.length) return true;
  return !EXCLUDE_FILTER.test(name);
}
const INVISIBLE_CHARS =
  /[\u00AD\u180E\u200B\u200E\u200F\u202A-\u202E\u2060-\u206F\uFEFF\u115F\u1160\u3164\uFFA0]/g;
const FLAG_RE = /[\u{1F1E6}-\u{1F1FF}]{2}/u;
// The script's normalizeProxyName: strip invisible characters, then
// move (or complete) the region flag to the front of the name.
function normalizePlainName(name) {
  const clean = String(name).replace(INVISIBLE_CHARS, "");
  const flag = clean.match(FLAG_RE)?.[0];
  const rest = (flag ? clean.replace(flag, "") : clean)
    .replace(/\s+/g, " ").trim();
  const { geo } = matchedRegions(clean);
  const regionFlag = flag || (geo.length ? REGION_DEFS[geo[0]][1] : undefined);
  return regionFlag ? `${regionFlag} ${rest}` : rest;
}
const RESERVED_NAMES = new Set([
  "默认代理", "GLOBAL", "手动选择", "自动选择", "负载均衡", "故障转移",
  "直连", "漏网之鱼", "远控工具", "AdBlock", "FCM", "YouTube", "Google",
  "Claude", "ClaudeAI", "GitHub", "AI", "Microsoft", "Apple", "Telegram",
  "Steam", "TikTok", "Twitter", "Meta", "Line", "Netflix", "Emby",
  "PikPak", "Spotify", "Crypto", "EHentai", "链式中转", "其他节点",
  "REJECT", "REJECT-DROP", "PASS", "DIRECT",
  "🇨🇳 直连 | 双栈", "🇨🇳 直连 | IPv4优先", "🇨🇳 直连 | IPv6优先",
  "🇨🇳 直连 | 仅IPv4", "🇨🇳 直连 | 仅IPv6",
  ...REGION_DEFS.map(([n]) => n),
  ...REGION_DEFS.map(([n]) => n + "-自动选择"),
  ...EXTRA_DEFS.map((d) => d.name),
  ...EXTRA_DEFS.map((d) => d.name + "-自动选择"),
  "其他节点-自动选择",
]);
// Plain-conversion node preparation, mirroring the script's
// filterAndNormalizeProxies: drop built-in / info nodes, normalize
// names, guard reserved names, dedupe keeping the first occurrence.
// Returns the kept nodes plus the original → final name map (for
// dialer-proxy reference repair).
function preparePlainNodes(nodes) {
  const kept = [];
  const renameMap = new Map();
  const used = new Set();
  for (const node of nodes) {
    const raw = String(node.name ?? "");
    const t = String(node.type ?? "").toLowerCase();
    if (t === "direct" || t === "reject") continue;
    if (!keepPlainNode(raw)) continue;
    let nn = normalizePlainName(raw);
    if (RESERVED_NAMES.has(nn)) {
      let cand = "节点-" + nn;
      let i = 2;
      while (used.has(cand) || RESERVED_NAMES.has(cand)) {
        cand = "节点-" + nn + "-" + i++;
      }
      nn = cand;
    }
    if (!renameMap.has(raw)) renameMap.set(raw, nn);
    if (used.has(nn)) continue;
    used.add(nn);
    kept.push(nn === raw ? node : { ...node, name: nn });
  }
  return { nodes: kept, renameMap };
}
const MEMBER_TOKENS = new Set(["@ENTRIES@", "@EXITS@", "@ALL@"]);
const LINK_ALPHABET =
  "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_CHARS = ("abcdefghijklmnopqrstuvwxyz" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_");
const MANIFEST = rulesManifest;
const DST_SET = new Set(MANIFEST.map((e) => e.dst));
const STAGE = { cur: "-" };
const ECH_CFG_CACHE = new Map();

const PAGE = "<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n<title>订阅转换</title>\n<style>\n:root{color-scheme:dark}\n*{box-sizing:border-box}\nbody{font-family:Inter,system-ui,-apple-system,\"Segoe UI\",Roboto,\"PingFang SC\",\"Microsoft YaHei\",sans-serif;background:#060809;color:#eef6f5;margin:0;padding:24px 16px 40px}\n.wrap{max-width:600px;margin:0 auto}\nh1{font-size:31px;font-weight:800;letter-spacing:.05em;text-align:center;margin:0 0 8px;background:linear-gradient(90deg,#2dd4bf,#3b82f6);-webkit-background-clip:text;background-clip:text;color:transparent}\n.sub{color:#a3bab5;font-size:14px;margin:0;text-align:center}\n.hero{text-align:center;margin:10px 0 22px}\n.hero-badge{display:inline-block;font-size:11px;letter-spacing:.28em;color:#5eead4;border:1px solid rgba(45,212,191,.45);background:rgba(20,184,166,.10);padding:5px 12px 5px 15px;border-radius:999px;margin-bottom:14px}\n.hero::after{content:\"\";display:block;width:64px;height:3px;border-radius:2px;margin:16px auto 0;background:linear-gradient(90deg,#2dd4bf,#3b82f6)}\n.card{background:#0c1113;border:1px solid #1f2a2f;border-radius:12px;padding:16px;margin-bottom:16px}\n.card h2{font-size:15px;margin:0 0 10px;color:#eef6f5}\n.restore{display:flex;gap:8px}\n.restore input{flex:1}\n.tabs{display:flex;gap:8px;margin-bottom:16px}\n.tabs button{flex:1;padding:11px;border:1px solid #31424a;border-radius:10px;background:#11181b;color:#c3d2d0;font-size:15px;cursor:pointer}\n.tabs button.on{background:linear-gradient(135deg,#14b8a6,#2563eb);color:#fff;border-color:#14b8a6}\nlabel{display:block;margin:16px 0 6px;color:#c3d2d0;font-size:14px}\nlabel:first-of-type{margin-top:4px}\nselect,textarea,input{width:100%;padding:10px;border-radius:8px;border:1px solid #31424a;background:#11181b;color:#eef6f5;font-size:15px}\nselect:focus,textarea:focus,input:focus{outline:2px solid #14b8a6;border-color:#14b8a6}\ntextarea{resize:vertical;font-family:inherit;line-height:1.5}\n.ta-wrap{position:relative}\n.clear{position:absolute;top:6px;right:6px;padding:3px 10px;border:1px solid #31424a;border-radius:6px;background:#162024;color:#a3bab5;font-size:12px;cursor:pointer}\n.go{margin-top:18px;width:100%;padding:13px;border:0;border-radius:10px;background:linear-gradient(135deg,#14b8a6,#2563eb);color:#fff;font-size:16px;cursor:pointer}\n.go:disabled{opacity:.55;cursor:wait}\n.err{display:none;color:#ef4444;font-size:14px;margin-top:10px}\n.ok{display:none;color:#22c55e;font-size:14px;margin-top:10px}\n.out{margin-top:18px;display:none}\n.link-row{background:#11181b;border:1px solid #1f2a2f;border-radius:10px;padding:12px;margin-top:10px}\n.link-row .tag{font-size:12px;color:#2dd4bf;margin-bottom:6px}\n.link-row .u{word-break:break-all;font-size:13px;color:#eef6f5;font-family:\"JetBrains Mono\",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}\n.link-row .ops{display:flex;gap:8px;margin-top:10px}\n.link-row .ops button,.link-row .ops a{flex:1;padding:9px;border:0;border-radius:8px;background:#1b272c;color:#eef6f5;font-size:14px;text-align:center;text-decoration:none;cursor:pointer}\n.link-row .ops a.imp{background:linear-gradient(135deg,#14b8a6,#2563eb);color:#fff}\n.note{color:#a3bab5;font-size:13px;margin-top:10px;line-height:1.6}\n.hide{display:none}\n.rgchip{padding:4px 11px;border-radius:999px;border:1px solid #31424a;background:#11181b;color:#c3d2d0;font-size:13px;cursor:pointer}\n.rgchip.on{border-color:#14b8a6;background:rgba(20,184,166,.2);color:#fff;font-weight:700}\nfooter{color:#5d726d;font-size:13px;margin-top:24px;line-height:1.6}\n/* 结构层 (2.2): 双列 — 主表单左, 恢复卡右轨 */\n.wrap{max-width:860px}\n.wrap>.card{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 16px;margin-bottom:16px}\n.wrap>.card h2{margin:0;font-size:14px;white-space:nowrap}\n.wrap>.card .restore{flex:1;min-width:220px}\n.wrap>.card .err,.wrap>.card .ok{flex-basis:100%;margin-top:2px}\n</style>\n</head>\n<body>\n<div class=\"wrap\">\n<header class=\"hero\">\n<div class=\"hero-badge\">SUBSCRIPTION CONVERTER</div>\n<h1>订阅转换</h1>\n<p class=\"sub\">把节点、订阅转成客户端能直接用的订阅链接，支持普通转换与链式代理。</p>\n</header>\n\n<div class=\"card\">\n<h2>已有短链？恢复上次的填写</h2>\n<div class=\"restore\">\n<input id=\"rcode\" placeholder=\"粘贴短码或完整链接\">\n<button class=\"go\" style=\"margin-top:0;width:auto;padding:10px 18px\" onclick=\"restore()\">恢复</button>\n</div>\n<div class=\"err\" id=\"rerr\">没找到这个短码</div>\n<div class=\"ok\" id=\"rok\">已恢复到下方表单，可修改后重新生成</div>\n</div>\n\n<div class=\"tabs\">\n<button id=\"tabN\" class=\"on\" onclick=\"mode('n')\">普通转换</button>\n<button id=\"tabC\" onclick=\"mode('c')\">链式代理</button>\n</div>\n\n<div id=\"secN\">\n<label>节点 / 订阅（每行一个，可任意混填）</label>\n<div class=\"ta-wrap\"><textarea id=\"u\" rows=\"6\" placeholder=\"ss://...&#10;trojan://...&#10;https://订阅地址\"></textarea><button class=\"clear\" onclick=\"clr('u')\">清空</button></div>\n<label>目标格式</label>\n<select id=\"t\">\n<option value=\"clash\">Clash / Mihomo</option>\n<option value=\"singbox\">sing-box</option>\n<option value=\"v2ray\">V2Ray</option>\n<option value=\"surge\">Surge</option>\n<option value=\"loon\">Loon</option>\n<option value=\"quanx\">Quantumult X</option>\n</select>\n<label>只保留这些地区的节点（可选，不选 = 全部保留）</label>\n<div id=\"rgChips\" style=\"display:flex;flex-wrap:wrap;gap:6px\"></div>\n<input id=\"rgExtra\" placeholder=\"其它地区代码，逗号分隔（如 DE,GB）\" style=\"margin-top:8px\">\n<label>自定义后缀（可选，不填则随机）</label>\n<input id=\"codeN\" placeholder=\"如 home，只用字母、数字、-、_\">\n<button class=\"go\" id=\"goN\" onclick=\"genN()\">生成转换链接</button>\n<div class=\"err\" id=\"errN\"></div>\n<div class=\"out\" id=\"outN\"></div>\n</div>\n\n<div id=\"secC\" class=\"hide\">\n<label>入口（每行一个，可混填节点与订阅）</label>\n<div class=\"ta-wrap\"><textarea id=\"ein\" rows=\"4\" placeholder=\"链的第一站，如日本入口节点或入口订阅\"></textarea><button class=\"clear\" onclick=\"clr('ein')\">清空</button></div>\n<label>出口（每行一个，可混填节点与订阅）</label>\n<div class=\"ta-wrap\"><textarea id=\"eout\" rows=\"4\" placeholder=\"链的第二站，如美国出口节点或出口订阅\"></textarea><button class=\"clear\" onclick=\"clr('eout')\">清空</button></div>\n<label>目标格式</label>\n<select id=\"tc\">\n<option value=\"singbox\">sing-box</option>\n<option value=\"clash\">Mihomo / Clash</option>\n<option value=\"surge\">Surge</option>\n<option value=\"loon\">Loon</option>\n<option value=\"quanx\">Quantumult X</option>\n</select>\n<label>自定义后缀（可选，不填则随机）</label>\n<input id=\"codeC\" placeholder=\"如 chain，只用字母、数字、-、_\">\n<button class=\"go\" id=\"goC\" onclick=\"genC()\">生成链式订阅链接</button>\n<div class=\"err\" id=\"errC\"></div>\n<div class=\"out\" id=\"outC\"></div>\n<p class=\"note\">生成的链接可直接当订阅地址填进客户端，每次更新都会重新按入口到出口串好。短链里的字母代表格式：/m/ 是 Mihomo、/s/ 是 sing-box，同一个码改字母就能切换格式，不用重新生成。</p>\n</div>\n\n<footer>运行在你自己的 Cloudflare 账号上（Workers + KV），订阅内容只保存在你的 KV 中，不经过任何第三方。</footer>\n</div>\n<script>\nfunction $(id){return document.getElementById(id)}\nfunction mode(m){\n  $(\"secN\").className = m===\"n\" ? \"\" : \"hide\";\n  $(\"secC\").className = m===\"c\" ? \"\" : \"hide\";\n  $(\"tabN\").className = m===\"n\" ? \"on\" : \"\";\n  $(\"tabC\").className = m===\"c\" ? \"on\" : \"\";\n}\nfunction clr(id){$(id).value=\"\";$(id).focus()}\nfunction lines(id){\n  return $(id).value.split(/\\n+/).map(function(s){return s.trim()}).filter(function(s){return s.length>0});\n}\nfunction showErr(id,msg){var e=$(id);e.textContent=msg;e.style.display=\"block\"}\nfunction hideErr(id){$(id).style.display=\"none\"}\nfunction extractCode(s){\n  s=(s||\"\").trim();\n  if(!s) return \"\";\n  s=s.split(/[?#]/)[0];\n  var parts=s.split(\"/\").filter(function(p){return p.length>0});\n  return parts.length?parts[parts.length-1]:\"\";\n}\nfunction restore(){\n  var code=extractCode($(\"rcode\").value);\n  $(\"rerr\").style.display=\"none\";$(\"rok\").style.display=\"none\";\n  if(!code){$(\"rerr\").style.display=\"block\";return}\n  fetch(\"/api/link/\"+encodeURIComponent(code)).then(function(r){\n    if(!r.ok) throw new Error(\"nf\");\n    return r.json();\n  }).then(function(rec){\n    if(rec.kind===\"chain\"){\n      mode(\"c\");\n      $(\"ein\").value=(rec.entry||\"\").split(\"|\").join(\"\\n\");\n      $(\"eout\").value=(rec.exit||\"\").split(\"|\").join(\"\\n\");\n      if(rec.target) $(\"tc\").value=rec.target;\n      $(\"codeC\").value=code;\n    }else{\n      mode(\"n\");\n      $(\"u\").value=(rec.url||\"\").split(\"|\").join(\"\\n\");\n      if(rec.target) $(\"t\").value=rec.target; RGSEL={};(rec.regions||[]).forEach(function(c){RGSEL[c]=1});rgSync();\n      $(\"codeN\").value=code;\n    }\n    $(\"rok\").style.display=\"block\";\n  }).catch(function(){\n    $(\"rerr\").style.display=\"block\";\n  });\n}\nfunction copyText(btn,txt){\n  function done(){var o=btn.textContent;btn.textContent=\"已复制\";setTimeout(function(){btn.textContent=o},1200)}\n  if(navigator.clipboard&&navigator.clipboard.writeText){\n    navigator.clipboard.writeText(txt).then(done).catch(function(){fallback()});\n  }else{fallback()}\n  function fallback(){\n    var ta=document.createElement(\"textarea\");\n    ta.value=txt;document.body.appendChild(ta);ta.select();\n    try{document.execCommand(\"copy\");done()}catch(e){}\n    document.body.removeChild(ta);\n  }\n}\nfunction linkRow(tag,url,imp){\n  var row=document.createElement(\"div\");row.className=\"link-row\";\n  var t=document.createElement(\"div\");t.className=\"tag\";t.textContent=tag;row.appendChild(t);\n  var u=document.createElement(\"div\");u.className=\"u\";u.textContent=url;row.appendChild(u);\n  var ops=document.createElement(\"div\");ops.className=\"ops\";\n  var cp=document.createElement(\"button\");cp.textContent=\"复制链接\";\n  cp.onclick=function(){copyText(cp,url)};\n  ops.appendChild(cp);\n  var op=document.createElement(\"button\");op.textContent=\"打开链接\";\n  op.onclick=function(){location.href=url};\n  ops.appendChild(op);\n  if(imp){\n    var a=document.createElement(\"a\");a.className=\"imp\";a.textContent=imp.label;a.href=imp.href;\n    ops.appendChild(a);\n  }\n  row.appendChild(ops);\n  return row;\n}\nfunction render(outId,rows,note){\n  var out=$(outId);out.innerHTML=\"\";\n  rows.forEach(function(r){out.appendChild(linkRow(r.tag,r.url,r.imp))});\n  if(note){\n    var n=document.createElement(\"div\");n.className=\"note\";n.textContent=note;out.appendChild(n);\n  }\n  out.style.display=\"block\";\n}\nfunction shorten(body){\n  return fetch(\"/shorten\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"},body:JSON.stringify(body)})\n    .then(function(r){return r.text().then(function(t){return {ok:r.ok,text:t}})});\n}\nvar RGSEL={};\nfunction rgSync(){document.querySelectorAll(\".rgchip\").forEach(function(ch){ch.className=RGSEL[ch.getAttribute(\"data-c\")]?\"rgchip on\":\"rgchip\"})}\nfunction rgSel(){var s={};for(var k in RGSEL)if(RGSEL[k])s[k]=1;var ex=$(\"rgExtra\");if(ex)ex.value.split(/[,\\s]+/).forEach(function(x){x=x.trim().toUpperCase();if(x)s[x]=1});return Object.keys(s)}\nfunction rgBuild(codes){var box=$(\"rgChips\");if(!box)return;box.innerHTML=\"\";codes.forEach(function(c){var b=document.createElement(\"button\");b.type=\"button\";b.className=\"rgchip\";b.setAttribute(\"data-c\",c);b.textContent=c;b.onclick=function(){RGSEL[c]=!RGSEL[c];rgSync()};box.appendChild(b)});rgSync()}\n(function(){var pop=[\"JP\",\"HK\",\"SG\",\"US\",\"TW\",\"KR\",\"DE\",\"GB\",\"FR\",\"NL\",\"CA\",\"AU\"];rgBuild(pop);fetch(\"/?get_regions=1\").then(function(r){return r.json()}).then(function(cs){if(cs&&cs.length)rgBuild(cs)}).catch(function(){})})();\nfunction genN(){\n  var it=lines(\"u\");hideErr(\"errN\");\n  if(!it.length){showErr(\"errN\",\"先粘贴节点或订阅链接\");return}\n  var tg=$(\"t\").value, cd=$(\"codeN\").value.trim();\n  var body={target:tg,url:it.join(\"|\")}; if(cd)body.code=cd; var rgs=rgSel(); if(rgs.length)body.regions=rgs.join(\"-\");\n  var btn=$(\"goN\");btn.disabled=true;btn.textContent=\"生成中…\";\n  shorten(body).then(function(res){\n    if(res.ok){\n      var url=res.text.trim(), code=extractCode(url);\n      if((tg===\"clash\"||tg===\"singbox\")&&code){\n        var rows=[\n          {tag:\"生成时格式\",url:location.origin+\"/c/\"+code},\n          {tag:\"Mihomo\",url:location.origin+\"/m/\"+code,imp:tg===\"clash\"?{label:\"一键导入 Clash\",href:\"clash://install-config?url=\"+encodeURIComponent(location.origin+\"/m/\"+code)}:null},\n          {tag:\"sing-box\",url:location.origin+\"/s/\"+code,imp:tg===\"singbox\"?{label:\"一键导入 sing-box\",href:\"sing-box://import-remote-profile?url=\"+encodeURIComponent(location.origin+\"/s/\"+code)}:null}\n        ];\n        render(\"outN\",rows,\"\");\n      }else{\n        render(\"outN\",[{tag:\"订阅链接\",url:url}],\"\");\n      }\n    }else if(cd){\n      showErr(\"errN\",res.text||\"生成失败\");\n    }else{\n      var base=(tg===\"clash\"||tg===\"singbox\")?\"/conv\":\"/sub\";\n      var u2=location.origin+base+\"?target=\"+tg+\"&url=\"+encodeURIComponent(it.join(\"|\"));\n      render(\"outN\",[{tag:\"订阅链接（长链接）\",url:u2}],\"短链服务暂不可用，已生成长链接\");\n    }\n  }).catch(function(){\n    if(cd){showErr(\"errN\",\"生成失败，请稍后再试\")}\n    else{\n      var base=(tg===\"clash\"||tg===\"singbox\")?\"/conv\":\"/sub\";\n      var u2=location.origin+base+\"?target=\"+tg+\"&url=\"+encodeURIComponent(it.join(\"|\"));\n      render(\"outN\",[{tag:\"订阅链接（长链接）\",url:u2}],\"短链服务暂不可用，已生成长链接\");\n    }\n  }).finally(function(){btn.disabled=false;btn.textContent=\"生成转换链接\"});\n}\nfunction genC(){\n  var a=lines(\"ein\"), b=lines(\"eout\");hideErr(\"errC\");\n  if(!a.length||!b.length){showErr(\"errC\",\"入口和出口都要填\");return}\n  var tg=$(\"tc\").value, cd=$(\"codeC\").value.trim();\n  var body={target:tg,entry:a.join(\"|\"),exit:b.join(\"|\")}; if(cd)body.code=cd;\n  var btn=$(\"goC\");btn.disabled=true;btn.textContent=\"生成中…\";\n  shorten(body).then(function(res){\n    if(res.ok){\n      var url=res.text.trim(), code=extractCode(url);\n      if(code){\n        var rows=[\n          {tag:\"生成时格式\",url:location.origin+\"/c/\"+code},\n          {tag:\"Mihomo\",url:location.origin+\"/m/\"+code,imp:tg===\"clash\"?{label:\"一键导入 Clash\",href:\"clash://install-config?url=\"+encodeURIComponent(location.origin+\"/m/\"+code)}:null},\n          {tag:\"sing-box\",url:location.origin+\"/s/\"+code,imp:tg===\"singbox\"?{label:\"一键导入 sing-box\",href:\"sing-box://import-remote-profile?url=\"+encodeURIComponent(location.origin+\"/s/\"+code)}:null}\n        ];\n        render(\"outC\",rows,\"\");\n      }else{\n        render(\"outC\",[{tag:\"订阅链接\",url:url}],\"\");\n      }\n    }else if(cd){\n      showErr(\"errC\",res.text||\"生成失败\");\n    }else{\n      var u2=location.origin+\"/chain?target=\"+tg+\"&entry=\"+encodeURIComponent(a.join(\"|\"))+\"&exit=\"+encodeURIComponent(b.join(\"|\"));\n      render(\"outC\",[{tag:\"订阅链接（长链接）\",url:u2}],\"短链服务暂不可用，已生成长链接\");\n    }\n  }).catch(function(){\n    if(cd){showErr(\"errC\",\"生成失败，请稍后再试\")}\n    else{\n      var u2=location.origin+\"/chain?target=\"+tg+\"&entry=\"+encodeURIComponent(a.join(\"|\"))+\"&exit=\"+encodeURIComponent(b.join(\"|\"));\n      render(\"outC\",[{tag:\"订阅链接（长链接）\",url:u2}],\"短链服务暂不可用，已生成长链接\");\n    }\n  }).finally(function(){btn.disabled=false;btn.textContent=\"生成链式订阅链接\"});\n}\n</script>\n</body>\n</html>\n";

// ------------------------------------------------------------ utilities
const _enc = new TextEncoder();
const _dec = new TextDecoder();

function isObj(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function nonEmptyObj(v) {
  return isObj(v) && Object.keys(v).length > 0;
}

function safeDecode(s) {
  s = s ?? "";
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function b64ToBytes(s) {
  let t = String(s).replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  t += "=".repeat((4 - (t.length % 4)) % 4);
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64ToText(s) {
  return _dec.decode(b64ToBytes(s));
}

function intOr(v, dflt) {
  if (!v) return dflt;
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error("bad int");
  return Math.trunc(n);
}

function toPort(v, dflt) {
  if (v === null || v === undefined || v === "" || v === 0) return dflt;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : dflt;
}

function partition(s, sep) {
  const i = s.indexOf(sep);
  if (i < 0) return [s, ""];
  return [s.slice(0, i), s.slice(i + sep.length)];
}

function rpartition(s, sep) {
  const i = s.lastIndexOf(sep);
  if (i < 0) return ["", s];
  return [s.slice(0, i), s.slice(i + sep.length)];
}

function qmap(searchParams) {
  const m = new Map();
  for (const k of new Set(searchParams.keys())) m.set(k, searchParams.getAll(k));
  return m;
}

function q1(q, key) {
  const v = q.get(key);
  return v && v.length ? v[0] : undefined;
}

function errMsg(e) {
  return e instanceof Error ? e.message : String(e);
}

// ------------------------------------------------------------- URI -> node
function applyTransport(node, q) {
  const net = (q1(q, "type") || "tcp").toLowerCase();
  node.network = net;
  if (net === "ws") {
    const ws = {};
    const path = q1(q, "path");
    if (path) ws.path = path;
    const host = q1(q, "host");
    if (host) ws.headers = { Host: host };
    if (Object.keys(ws).length) node["ws-opts"] = ws;
  } else if (net === "grpc") {
    const sn = q1(q, "serviceName");
    if (sn) node["grpc-opts"] = { "grpc-service-name": sn };
  }
}

function applyTlsUri(node, q) {
  const sec = (q1(q, "security") || "none").toLowerCase();
  if (sec === "reality") {
    node.tls = true;
    const ro = {};
    const pbk = q1(q, "pbk");
    if (pbk) ro["public-key"] = pbk;
    const sid = q1(q, "sid");
    if (sid) ro["short-id"] = sid;
    node["reality-opts"] = ro;
  } else if (sec === "tls") {
    node.tls = true;
  }
  const sni = q1(q, "sni") ?? q1(q, "peer");
  if (sni) node.servername = sni;
  const fp = q1(q, "fp");
  if (fp) node["client-fingerprint"] = fp;
  const flow = q1(q, "flow");
  if (flow) node.flow = flow;
  const ai = q1(q, "allowInsecure");
  if (ai === "1" || ai === "true") node["skip-cert-verify"] = true;
}

function parseUri(line) {
  line = String(line).trim();
  if (!line.includes("://")) return null;
  const idx = line.indexOf("://");
  const scheme = line.slice(0, idx).toLowerCase();
  const rest = line.slice(idx + 3);
  try {
    if (scheme === "vmess") {
      const doc = JSON.parse(b64ToText(rest.split("#")[0]));
      const node = {
        name: doc.ps || "vmess", type: "vmess", server: doc.add,
        port: intOr(doc.port, 443), uuid: doc.id,
        alterId: intOr(doc.aid, 0), cipher: doc.scy || "auto",
        network: String(doc.net || "tcp").toLowerCase(),
      };
      if (doc.tls === "tls") node.tls = true;
      if (doc.sni) node.servername = doc.sni;
      if (node.network === "ws") {
        const ws = {};
        if (doc.path) ws.path = doc.path;
        if (doc.host) ws.headers = { Host: doc.host };
        if (Object.keys(ws).length) node["ws-opts"] = ws;
      } else if (node.network === "grpc" && doc.path) {
        node["grpc-opts"] = { "grpc-service-name": doc.path };
      }
      return node;
    }
    const u = new URL(line);
    const host = u.hostname || null;
    const port = u.port ? Number(u.port) : null;
    const name = safeDecode(u.hash ? u.hash.slice(1) : "") || scheme;
    const q = qmap(u.searchParams);
    const user = safeDecode(u.username || "");
    if (scheme === "vless") {
      const node = {
        name, type: "vless", server: host, port: port || 443, uuid: user,
      };
      applyTlsUri(node, q);
      applyTransport(node, q);
      return node;
    }
    if (scheme === "trojan") {
      const node = {
        name, type: "trojan", server: host, port: port || 443,
        password: user, tls: true,
      };
      applyTlsUri(node, q);
      applyTransport(node, q);
      return node;
    }
    if (scheme === "ss") {
      if (u.username && u.hostname) {
        const ui = u.username;
        let dec;
        try {
          dec = b64ToText(safeDecode(ui));
        } catch {
          dec = safeDecode(ui);
        }
        const [method, pwd] = partition(dec, ":");
        return {
          name, type: "ss", server: host, port: port || 8388,
          cipher: method, password: pwd,
        };
      }
      const doc = b64ToText(rest.split("#")[0]);
      const [cred, addr] = rpartition(doc, "@");
      const [method, pwd] = partition(cred, ":");
      const [h, p] = rpartition(addr, ":");
      return {
        name, type: "ss", server: h, port: intOr(p, 8388),
        cipher: method, password: pwd,
      };
    }
    if (scheme === "hysteria2" || scheme === "hy2") {
      const node = {
        name, type: "hysteria2", server: host, port: port || 443,
        password: user,
      };
      const sni = q1(q, "sni");
      if (sni) node.sni = sni;
      const obfs = q1(q, "obfs");
      if (obfs) node.obfs = obfs;
      const op = q1(q, "obfs-password");
      if (op) node["obfs-password"] = op;
      const ins = q1(q, "insecure");
      if (ins === "1" || ins === "true") node["skip-cert-verify"] = true;
      return node;
    }
    if (scheme === "tuic") {
      const [uuid, pwd] = partition(user, ":");
      const node = {
        name, type: "tuic", server: host, port: port || 443,
        uuid, password: pwd,
      };
      const sni = q1(q, "sni");
      if (sni) node.sni = sni;
      const alpn = q1(q, "alpn");
      if (alpn) node.alpn = [alpn];
      const cc = q1(q, "congestion_control");
      if (cc) node["congestion-controller"] = cc;
      const urm = q1(q, "udp_relay_mode");
      if (urm) node["udp-relay-mode"] = urm;
      return node;
    }
    if (scheme === "anytls") {
      const node = {
        name, type: "anytls", server: host, port: port || 443,
        password: user, tls: true,
      };
      const sni = q1(q, "sni");
      if (sni) node.servername = sni;
      return node;
    }
  } catch {
    return null;
  }
  return null;
}

// ------------------------------------------------- sing-box outbound -> node
function sbToNode(o) {
  const t = o.type;
  const node = { name: o.tag, type: t, server: o.server, port: o.server_port };
  const tls = o.tls || {};
  if (tls.enabled) {
    node.tls = true;
    if (tls.server_name) node.servername = tls.server_name;
    if (tls.insecure) node["skip-cert-verify"] = true;
    if (tls.utls && tls.utls.fingerprint) {
      node["client-fingerprint"] = tls.utls.fingerprint;
    }
    if (tls.reality && tls.reality.enabled) {
      node["reality-opts"] = {
        "public-key": tls.reality.public_key ?? "",
        "short-id": tls.reality.short_id ?? "",
      };
    }
  }
  const tr = o.transport || {};
  if (tr.type === "ws") {
    node.network = "ws";
    const ws = {};
    if (tr.path) ws.path = tr.path;
    const host = (tr.headers || {}).Host;
    if (host) ws.headers = { Host: host };
    if (Object.keys(ws).length) node["ws-opts"] = ws;
  } else if (tr.type === "grpc") {
    node.network = "grpc";
    if (tr.service_name) {
      node["grpc-opts"] = { "grpc-service-name": tr.service_name };
    }
  }
  if (t === "vless" || t === "vmess" || t === "tuic") node.uuid = o.uuid;
  if (t === "vless" && o.flow) node.flow = o.flow;
  if (t === "vmess") {
    node.alterId = o.alter_id || 0;
    node.cipher = o.security || "auto";
  }
  if (t === "trojan" || t === "anytls") node.password = o.password;
  if (t === "shadowsocks") {
    node.type = "ss";
    node.cipher = o.method;
    node.password = o.password;
  }
  if (t === "tuic") {
    node.password = o.password;
    if (o.congestion_control) node["congestion-controller"] = o.congestion_control;
    if (o.udp_relay_mode) node["udp-relay-mode"] = o.udp_relay_mode;
  }
  if (t === "hysteria2") {
    node.password = o.password || o.auth;
    if (o.obfs && o.obfs.password) {
      node.obfs = o.obfs.type || "salamander";
      node["obfs-password"] = o.obfs.password;
    }
  }
  return node;
}

// ---------------------------------------------------------------- gathering
async function classifyText(text, depth) {
  text = String(text).trim();
  if (!text) return [];
  if (text.startsWith("{")) {
    try {
      const doc = JSON.parse(text);
      if (isObj(doc) && Array.isArray(doc.outbounds)) {
        return doc.outbounds
          .filter((o) => isObj(o) && !GROUP_TYPES.has(o.type) &&
            !BUILTIN_TYPES.has(o.type) && o.server)
          .map(sbToNode);
      }
    } catch {
      // fall through to the YAML attempt, like the Python service
    }
  }
  try {
    const doc = yamlLoad(text);
    if (isObj(doc)) {
      if (Array.isArray(doc.proxies) && doc.proxies.length) {
        return doc.proxies.filter(isObj);
      }
      if (nonEmptyObj(doc["proxy-providers"]) && depth < 2) {
        // Full Mihomo configs often carry nodes only via providers:
        // resolve each provider URL and gather its nodes instead.
        const nodes = [];
        for (const pv of Object.values(doc["proxy-providers"])) {
          const url = isObj(pv) ? pv.url : undefined;
          if (url) nodes.push(...await nodesFromUrl(url, depth + 1));
        }
        if (nodes.length) return nodes;
      }
    }
  } catch {
    // fall through
  }
  try {
    const decoded = b64ToText(text);
    if (decoded.includes("://") || decoded.includes("proxies:")) {
      const inner = await classifyText(decoded, depth);
      if (inner.length) return inner;
    }
  } catch {
    // fall through
  }
  const out = [];
  for (const l of text.split(/\r\n|\r|\n/)) {
    const n = parseUri(l);
    if (n) out.push(n);
  }
  return out;
}

async function fetchTextWithUa(url, ua) {
  const resp = await fetch(url, {
    headers: { "User-Agent": ua },
    signal: AbortSignal.timeout(20000),
  });
  if (!resp.ok) throw new Error("HTTP " + resp.status);
  return resp.text();
}

async function nodesFromUrl(url, depth) {
  // Aggregators serve different renditions per UA: a Mihomo client UA
  // gets the full Clash YAML (incl. ECH options); a browser UA gets a
  // reduced format. Try the client UA first, browser UA as fallback.
  for (const ua of ["clash-verge/2.2.3", "clash-verge/2.2.3",
    "sing-box/1.15.0", BROWSER_UA]) {
    try {
      const found = await classifyText(await fetchTextWithUa(url, ua), depth);
      if (found.length) return found;
    } catch {
      continue;
    }
  }
  return [];
}

async function gather(items) {
  const nodes = [];
  const seen = new Map();
  for (let item of String(items).split("|")) {
    item = item.trim();
    if (!item) continue;
    let found;
    if (item.startsWith("http://") || item.startsWith("https://")) {
      found = await nodesFromUrl(item, 0);
    } else {
      const n = parseUri(item);
      found = n ? [n] : [];
    }
    for (let n of found) {
      if (!n.server || !n.type) continue;
      let name = String(n.name || n.type);
      if (seen.has(name)) {
        const c = seen.get(name) + 1;
        seen.set(name, c);
        name = `${name}-${c}`;
        n = { ...n, name };
      } else {
        seen.set(name, 1);
      }
      nodes.push(n);
    }
  }
  return nodes;
}

// ------------------------------------------------------------- node -> emit
function tlsSb(node) {
  const tls = { enabled: true };
  const sni = node.servername || node.sni;
  if (sni) tls.server_name = sni;
  if (node["skip-cert-verify"]) tls.insecure = true;
  if (node["client-fingerprint"]) {
    tls.utls = { enabled: true, fingerprint: node["client-fingerprint"] };
  }
  const ro = node["reality-opts"];
  if (nonEmptyObj(ro)) {
    tls.reality = {
      enabled: true,
      public_key: ro["public-key"] ?? "",
      short_id: ro["short-id"] ?? "",
    };
  }
  const eo = node["ech-opts"];
  if (isObj(eo) && eo.enable && eo["query-server-name"]) {
    tls.ech = { enabled: true, query_server_name: eo["query-server-name"] };
  }
  return tls;
}

function transportSb(node) {
  const net = String(node.network || "tcp").toLowerCase();
  if (net === "ws") {
    const ws = node["ws-opts"] || {};
    const tr = { type: "ws", path: ws.path || "/" };
    const host = (ws.headers || {}).Host;
    if (host) tr.headers = { Host: host };
    return tr;
  }
  if (net === "grpc") {
    return {
      type: "grpc",
      service_name: (node["grpc-opts"] || {})["grpc-service-name"] || "",
    };
  }
  return null;
}

function sbEmit(node) {
  const t = String(node.type || "").toLowerCase();
  const ob = {
    type: t, tag: String(node.name || t), server: node.server,
    server_port: toPort(node.port, 443),
    // sing-box 1.12 migration: replaces the legacy outbound DNS rule.
    // The chain builders repoint it at dns-cn via sbLeafFix.
    domain_resolver: "dns_resolver",
  };
  if (t === "shadowsocks" || t === "ss") {
    ob.type = "shadowsocks";
    ob.method = node.cipher || "aes-256-gcm";
    ob.password = node.password || "";
  } else if (t === "vless") {
    ob.uuid = node.uuid || "";
    if (node.flow) ob.flow = node.flow;
    if (node.tls || nonEmptyObj(node["reality-opts"])) ob.tls = tlsSb(node);
    const tr = transportSb(node);
    if (tr) ob.transport = tr;
  } else if (t === "vmess") {
    ob.uuid = node.uuid || "";
    ob.alter_id = intOr(node.alterId, 0);
    ob.security = node.cipher || "auto";
    if (node.tls || nonEmptyObj(node["reality-opts"])) ob.tls = tlsSb(node);
    const tr = transportSb(node);
    if (tr) ob.transport = tr;
  } else if (t === "trojan") {
    ob.password = node.password || "";
    ob.tls = tlsSb(node);
    const tr = transportSb(node);
    if (tr) ob.transport = tr;
  } else if (t === "tuic") {
    ob.uuid = node.uuid || "";
    ob.password = node.password || "";
    if (node["congestion-controller"]) {
      ob.congestion_control = node["congestion-controller"];
    }
    if (node["udp-relay-mode"]) ob.udp_relay_mode = node["udp-relay-mode"];
    const tls = { enabled: true };
    if (node.sni) tls.server_name = node.sni;
    if (node.alpn) tls.alpn = node.alpn;
    if (node["skip-cert-verify"]) tls.insecure = true;
    ob.tls = tls;
  } else if (t === "hysteria2" || t === "hy2") {
    ob.type = "hysteria2";
    ob.password = node.password || "";
    if (node.obfs) {
      ob.obfs = { type: node.obfs, password: node["obfs-password"] || "" };
    }
    const tls = { enabled: true };
    if (node.sni) tls.server_name = node.sni;
    if (node["skip-cert-verify"]) tls.insecure = true;
    ob.tls = tls;
  } else if (t === "anytls") {
    ob.password = node.password || "";
    ob.tls = tlsSb(node);
  } else {
    throw new Error(`unsupported node type for sing-box: ${t}`);
  }
  return ob;
}

function clashEmit(node) {
  const p = {};
  for (const [k, v] of Object.entries(node)) {
    if (v !== null && v !== undefined) p[k] = v;
  }
  if (String(p.type || "").toLowerCase() === "ss" && !("cipher" in p)) {
    p.cipher = "aes-256-gcm";
  }
  return p;
}

// ------------------------------------------- native text-format renderers
// V2Ray share links, Surge, Loon and Quantumult X are rendered natively
// here — no external subconverter is involved for any supported target.
// The line formats are grounded in two public references, checked
// 2026-11: subconverter's generators (src/generator/config/
// subexport.cpp: proxyToSingle / proxyToSurge / proxyToLoon /
// proxyToQuanX) and the clients' own sample configs (Quantumult X
// sample.conf v1.5.5, the Surge manual, Loon sample configs). Where
// the two disagree the client sample wins; every such call, and every
// deliberate deviation, is noted at the site and in
// NATIVE_FORMATS_REPORT.md.
//
// Node support follows the CLIENT, not the wish: a protocol a client
// cannot express is skipped (never emitted as a broken line). Surge
// has no VLESS and no TUIC (the Surge team's own statement; Mac users
// are pointed at the External Proxy Program), Quantumult X has no
// Hysteria2 / TUIC / Snell, share links have no Snell / SSR / SOCKS5 /
// HTTP form. gRPC transport exists only in the share-link formats
// (and clash / sing-box); Surge, Loon and Quantumult X skip gRPC
// nodes.
//
// Quantumult X section names are the client's real ones —
// [server_local] for server lines, [policy] for static /
// url-latency-benchmark groups, [filter_local] for rules. (An earlier
// design note called them [proxy_local] / [proxy_group]; Quantumult X
// has no such sections and would silently ignore them.)
const TEXT_TARGETS = new Set(["v2ray", "surge", "loon", "quanx"]);
const ALL_TARGETS = new Set(["clash", "singbox", ...TEXT_TARGETS]);
const TEST_URL = "https://www.gstatic.com/generate_204";
const AUTO_GROUP = "自动测速";
const CHAIN_GROUP = "⛓ 链式代理";

function textToB64(s) {
  const bytes = _enc.encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function b64UrlText(s) {
  return textToB64(s).replace(/\+/g, "-").replace(/\//g, "_")
    .replace(/=+$/, "");
}

function nodeType(node) {
  const t = String(node.type || "").toLowerCase();
  return t === "hy2" ? "hysteria2" : t;
}

function hostOf(node) {
  return String(node.server ?? "");
}

function urlHost(host) {
  return host.includes(":") && !host.startsWith("[")
    ? `[${host}]` : host;
}

function sniOf(node) {
  return node.servername || node.sni || "";
}

function wsHostOf(node) {
  return ((node["ws-opts"] || {}).headers || {}).Host || "";
}

function wsPathOf(node) {
  return (node["ws-opts"] || {}).path || "";
}

function grpcNameOf(node) {
  return (node["grpc-opts"] || {})["grpc-service-name"] || "";
}

function netOf(node) {
  return String(node.network || "tcp").toLowerCase();
}

function realityOf(node) {
  return nonEmptyObj(node["reality-opts"]) ? node["reality-opts"] : null;
}

function txtName(name) {
  // Remarks in the INI-style formats: '=' breaks Surge's parser
  // (subconverter replaces it with '-') and ',' is the parameter
  // separator, so both are neutralized. References are built from the
  // same sanitized names, so groups and rules stay consistent.
  return String(name ?? "").replace(/=/g, "-").replace(/,/g, " ")
    .replace(/\s+/g, " ").trim();
}

// ------------------------------------------------------------ share links
function ssPluginSip002(node) {
  const pl = String(node.plugin || "");
  const o = node["plugin-opts"] || {};
  if (pl === "obfs") {
    const parts = ["obfs-local", "obfs=" + (o.mode || "http")];
    if (o.host) parts.push("obfs-host=" + o.host);
    return parts.join(";");
  }
  if (pl === "v2ray-plugin") {
    const parts = ["v2ray-plugin", "mode=" + (o.mode || "websocket")];
    if (o.tls) parts.push("tls");
    if (o.host) parts.push("host=" + o.host);
    if (o.path) parts.push("path=" + o.path);
    return parts.join(";");
  }
  return "";
}

function nodeToShareLink(node) {
  const t = nodeType(node);
  const host = urlHost(hostOf(node));
  const port = portOf(node);
  const frag = "#" + encodeURIComponent(String(node.name || t));
  const sni = sniOf(node);
  const scv = node["skip-cert-verify"] === true;
  const net = netOf(node);
  const q = (pairs) => {
    const p = pairs.filter(([, v]) => v !== "" && v !== undefined &&
      v !== null);
    return p.length
      ? "?" + p.map(([k, v]) => k + "=" + encodeURIComponent(v)).join("&")
      : "";
  };
  if (t === "ss" || t === "shadowsocks") {
    const cred = b64UrlText(
      `${node.cipher || "aes-256-gcm"}:${node.password || ""}`);
    const plugin = ssPluginSip002(node);
    return `ss://${cred}@${host}:${port}` +
      (plugin ? "/?plugin=" + encodeURIComponent(plugin) : "") + frag;
  }
  if (t === "vmess") {
    const doc = {
      v: "2", ps: String(node.name || "vmess"), add: hostOf(node),
      port: String(port), id: node.uuid || "",
      aid: String(intOr(node.alterId, 0)),
      scy: node.cipher || "auto", net, type: "none",
      host: wsHostOf(node), path: wsPathOf(node),
      tls: node.tls ? "tls" : "",
    };
    if (net === "grpc") doc.path = grpcNameOf(node);
    if (sni) doc.sni = sni;
    if (Array.isArray(node.alpn) && node.alpn.length) {
      doc.alpn = node.alpn.join(",");
    }
    if (node["client-fingerprint"]) doc.fp = node["client-fingerprint"];
    return "vmess://" + textToB64(JSON.stringify(doc));
  }
  if (t === "vless") {
    const ro = realityOf(node);
    return `vless://${node.uuid || ""}@${host}:${port}` + q([
      ["encryption", "none"],
      ["security", ro ? "reality" : node.tls ? "tls" : "none"],
      ["sni", sni], ["fp", node["client-fingerprint"] || ""],
      ["pbk", ro ? ro["public-key"] || "" : ""],
      ["sid", ro ? ro["short-id"] || "" : ""],
      ["flow", node.flow || ""], ["type", net],
      ["host", wsHostOf(node)], ["path", wsPathOf(node)],
      ["serviceName", net === "grpc" ? grpcNameOf(node) : ""],
      ["allowInsecure", scv ? "1" : ""],
    ]) + frag;
  }
  if (t === "trojan") {
    return `trojan://${encodeURIComponent(node.password || "")}` +
      `@${host}:${port}` + q([
        ["sni", sni], ["type", net], ["host", wsHostOf(node)],
        ["path", wsPathOf(node)],
        ["serviceName", net === "grpc" ? grpcNameOf(node) : ""],
        ["allowInsecure", scv ? "1" : ""],
      ]) + frag;
  }
  if (t === "hysteria2") {
    return `hysteria2://${encodeURIComponent(node.password || "")}` +
      `@${host}:${port}` + q([
        ["sni", sni], ["obfs", node.obfs || ""],
        ["obfs-password", node["obfs-password"] || ""],
        ["insecure", scv ? "1" : ""],
      ]) + frag;
  }
  if (t === "tuic") {
    return `tuic://${node.uuid || ""}:` +
      `${encodeURIComponent(node.password || "")}@${host}:${port}` + q([
        ["sni", sni],
        ["alpn", Array.isArray(node.alpn) ? node.alpn.join(",") : ""],
        ["congestion_control", node["congestion-controller"] || ""],
        ["udp_relay_mode", node["udp-relay-mode"] || ""],
        ["allowInsecure", scv ? "1" : ""],
      ]) + frag;
  }
  if (t === "anytls") {
    return `anytls://${encodeURIComponent(node.password || "")}` +
      `@${host}:${port}` + q([
        ["sni", sni], ["insecure", scv ? "1" : ""],
      ]) + frag;
  }
  // snell, ssr, socks5, http, wireguard, ... have no standard share
  // link; skip rather than emit something no client can import.
  return null;
}

function portOf(node) {
  return toPort(node.port, 443);
}

// ------------------------------------------------------------------ Surge
// Line style follows subconverter's proxyToSurge (", " separators,
// key=value params). Per Surge's own manual the Hysteria2 type
// keyword is "hysteria2" (subconverter's "hysteria" predates it).
function surgeEmit(node) {
  const t = nodeType(node);
  const host = hostOf(node);
  const port = portOf(node);
  const sni = sniOf(node);
  const scv = node["skip-cert-verify"] === true;
  const net = netOf(node);
  const parts = [];
  const wsParams = () => {
    parts.push("ws=true");
    const p = wsPathOf(node);
    if (p) parts.push("ws-path=" + p);
    const h = wsHostOf(node);
    if (h) parts.push("ws-headers=Host:" + h);
  };
  if (t === "ss" || t === "shadowsocks") {
    parts.push("ss", host, String(port),
      "encrypt-method=" + (node.cipher || "aes-256-gcm"),
      "password=" + (node.password || ""));
    const pl = String(node.plugin || "");
    const o = node["plugin-opts"] || {};
    if (pl === "obfs") {
      parts.push("obfs=" + (o.mode || "http"));
      if (o.host) parts.push("obfs-host=" + o.host);
    } else if (pl) {
      return null; // v2ray-plugin & friends: Surge cannot express them
    }
  } else if (t === "vmess") {
    if (net !== "tcp" && net !== "ws") return null;
    parts.push("vmess", host, String(port),
      "username=" + (node.uuid || ""),
      "tls=" + (node.tls ? "true" : "false"),
      "vmess-aead=" + (intOr(node.alterId, 0) === 0 ? "true" : "false"));
    if (net === "ws") wsParams();
    const effSni = sni || wsHostOf(node);
    if (node.tls && effSni) parts.push("sni=" + effSni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "trojan") {
    if (net !== "tcp" && net !== "ws") return null;
    parts.push("trojan", host, String(port),
      "password=" + (node.password || ""));
    if (net === "ws") wsParams();
    const effSni = sni || wsHostOf(node);
    if (effSni) parts.push("sni=" + effSni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "hysteria2") {
    parts.push("hysteria2", host, String(port),
      "password=" + (node.password || ""));
    if (node.obfs) {
      parts.push("obfs=" + node.obfs);
      if (node["obfs-password"]) {
        parts.push("obfs-password=" + node["obfs-password"]);
      }
    }
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "anytls") {
    if (realityOf(node)) return null; // AnyTLS+Reality needs a kernel
    parts.push("anytls", host, String(port),
      "password=" + (node.password || ""));
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "snell") {
    parts.push("snell", host, String(port),
      "psk=" + (node.psk || node.password || ""));
    const o = node["obfs-opts"] || {};
    if (o.mode) {
      parts.push("obfs=" + o.mode);
      if (o.host) parts.push("obfs-host=" + o.host);
    }
    if (node.version) parts.push("version=" + node.version);
  } else if (t === "socks5") {
    parts.push(node.tls ? "socks5-tls" : "socks5", host, String(port));
    if (node.username) parts.push("username=" + node.username);
    if (node.password) parts.push("password=" + node.password);
    if (node.tls && sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "http") {
    parts.push("http", host, String(port));
    if (node.username) parts.push("username=" + node.username);
    if (node.password) parts.push("password=" + node.password);
    parts.push("tls=" + (node.tls ? "true" : "false"));
    if (scv) parts.push("skip-cert-verify=true");
  } else {
    // vless, tuic, ssr, wireguard, ... — Surge has no native syntax
    // for them (see the header note); skip.
    return null;
  }
  if (node.tfo === true) parts.push("tfo=true");
  if (node.udp === true) parts.push("udp-relay=true");
  return parts.join(", ");
}

// ------------------------------------------------------------------- Loon
// Line style follows subconverter's proxyToLoon: "Name = type,host,
// port,..." with positional credentials in double quotes. VLESS is
// emitted in Loon 3.x's own syntax (transport / over-tls / flow /
// public-key / short-id / sni), which subconverter does not generate.
function loonEmit(node) {
  const t = nodeType(node);
  const host = hostOf(node);
  const port = portOf(node);
  const sni = sniOf(node);
  const scv = node["skip-cert-verify"] === true;
  const net = netOf(node);
  const parts = [];
  const quoted = (v) => `"${String(v ?? "")}"`;
  if (t === "ss" || t === "shadowsocks") {
    parts.push("Shadowsocks", host, String(port),
      node.cipher || "aes-256-gcm", quoted(node.password || ""));
    const pl = String(node.plugin || "");
    const o = node["plugin-opts"] || {};
    if (pl === "obfs") {
      parts.push(String(o.mode || "http"));
      if (o.host) parts.push(String(o.host));
    } else if (pl) {
      return null;
    }
  } else if (t === "ssr") {
    parts.push("ShadowsocksR", host, String(port),
      node.cipher || "aes-256-cfb", quoted(node.password || ""),
      "protocol=" + (node.protocol || "origin"),
      "protocol-param=" + (node["protocol-param"] || ""),
      "obfs=" + (node.obfs || "plain"),
      "obfs-param=" + (node["obfs-param"] || ""));
  } else if (t === "vmess") {
    if (net !== "tcp" && net !== "ws") return null;
    const method = !node.cipher || node.cipher === "auto"
      ? "chacha20-ietf-poly1305" : node.cipher;
    parts.push("vmess", host, String(port), method,
      quoted(node.uuid || ""),
      "over-tls=" + (node.tls ? "true" : "false"));
    if (node.tls && sni) parts.push("tls-name=" + sni);
    if (net === "ws") {
      parts.push("transport=ws");
      if (wsPathOf(node)) parts.push("path=" + wsPathOf(node));
      if (wsHostOf(node)) parts.push("host=" + wsHostOf(node));
    } else {
      parts.push("transport=tcp");
    }
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "vless") {
    if (net !== "tcp" && net !== "ws") return null;
    parts.push("VLESS", host, String(port), quoted(node.uuid || ""));
    if (net === "ws") {
      parts.push("transport=ws");
      if (wsPathOf(node)) parts.push("path=" + wsPathOf(node));
      if (wsHostOf(node)) parts.push("host=" + wsHostOf(node));
    } else {
      parts.push("transport=tcp");
    }
    if (node.flow) parts.push("flow=" + node.flow);
    const ro = realityOf(node);
    if (ro) {
      parts.push("public-key=" + quoted(ro["public-key"] || ""));
      if (ro["short-id"]) parts.push("short-id=" + ro["short-id"]);
    }
    parts.push("over-tls=" + (node.tls || ro ? "true" : "false"));
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "trojan") {
    parts.push("trojan", host, String(port), quoted(node.password || ""));
    if (net === "ws") {
      parts.push("transport=ws");
      if (wsPathOf(node)) parts.push("path=" + wsPathOf(node));
      if (wsHostOf(node)) parts.push("host=" + wsHostOf(node));
    }
    if (sni) parts.push("tls-name=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "hysteria2") {
    parts.push("hysteria2", host, String(port), quoted(node.password || ""));
    if (node.obfs) {
      parts.push("obfs=" + node.obfs);
      if (node["obfs-password"]) {
        parts.push("obfs-password=" + node["obfs-password"]);
      }
    }
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "tuic") {
    parts.push("tuic", host, String(port), quoted(node.uuid || ""),
      quoted(node.password || ""));
    const alpn = Array.isArray(node.alpn) && node.alpn.length
      ? node.alpn[0] : "h3";
    parts.push("alpn=" + alpn);
    if (node["congestion-controller"]) {
      parts.push("congestion-controller=" + node["congestion-controller"]);
    }
    if (node["udp-relay-mode"]) {
      parts.push("udp-relay-mode=" + node["udp-relay-mode"]);
    }
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "anytls") {
    parts.push("anytls", host, String(port), quoted(node.password || ""));
    if (sni) parts.push("sni=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "snell") {
    parts.push("snell", host, String(port),
      "psk=" + (node.psk || node.password || ""));
    const o = node["obfs-opts"] || {};
    if (o.mode) {
      parts.push("obfs=" + o.mode);
      if (o.host) parts.push("obfs-host=" + o.host);
    }
    if (node.version) parts.push("version=" + node.version);
  } else if (t === "socks5") {
    parts.push("socks5", host, String(port));
    if (node.username || node.password) {
      parts.push(String(node.username || ""), quoted(node.password || ""));
    }
    parts.push("over-tls=" + (node.tls ? "true" : "false"));
    if (node.tls && sni) parts.push("tls-name=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else if (t === "http") {
    parts.push(node.tls ? "https" : "http", host, String(port));
    if (node.username || node.password) {
      parts.push(String(node.username || ""), quoted(node.password || ""));
    }
    if (node.tls && sni) parts.push("tls-name=" + sni);
    if (scv) parts.push("skip-cert-verify=true");
  } else {
    return null;
  }
  if (node.tfo === true) parts.push("fast-open=true");
  if (node.udp === true) parts.push("udp=true");
  return parts.join(",");
}

// ------------------------------------------------------------------ QuanX
// Line style follows the official sample.conf: "type=host:port,
// key=value, ..., tag=Name" in [server_local]; groups are [policy]
// lines. Reality uses reality-base64-pubkey / reality-hex-shortid
// (sample.conf), which subconverter's older QuanX generator lacks.
function quanxEmit(node) {
  const t = nodeType(node);
  const host = hostOf(node);
  const port = portOf(node);
  const sni = sniOf(node);
  const scv = node["skip-cert-verify"] === true;
  const net = netOf(node);
  const ro = realityOf(node);
  const parts = [];
  const realityParams = () => {
    if (!ro) return;
    parts.push("reality-base64-pubkey=" + (ro["public-key"] || ""));
    if (ro["short-id"]) {
      parts.push("reality-hex-shortid=" + ro["short-id"]);
    }
  };
  // Shared vmess/vless transport mapping (sample.conf): ws -> obfs=
  // ws|wss, plain TLS -> obfs=over-tls; obfs-host carries the SNI /
  // WS host. gRPC has no QuanX form.
  const obfsParams = (withTls) => {
    if (net === "grpc") return false;
    if (net === "ws") {
      parts.push("obfs=" + (withTls ? "wss" : "ws"));
      const h = wsHostOf(node) || sni;
      if (h) parts.push("obfs-host=" + h);
      if (wsPathOf(node)) parts.push("obfs-uri=" + wsPathOf(node));
    } else if (withTls) {
      parts.push("obfs=over-tls");
      if (sni) parts.push("obfs-host=" + sni);
    }
    return true;
  };
  if (t === "ss" || t === "shadowsocks") {
    parts.push(`shadowsocks=${host}:${port}`,
      "method=" + (node.cipher || "aes-256-gcm"),
      "password=" + (node.password || ""));
    const pl = String(node.plugin || "");
    const o = node["plugin-opts"] || {};
    if (pl === "obfs") {
      parts.push("obfs=" + (o.mode || "http"));
      if (o.host) parts.push("obfs-host=" + o.host);
    } else if (pl === "v2ray-plugin") {
      parts.push("obfs=" + (o.tls ? "wss" : "ws"));
      if (o.host) parts.push("obfs-host=" + o.host);
      if (o.path) parts.push("obfs-uri=" + o.path);
    } else if (pl) {
      return null;
    }
  } else if (t === "ssr") {
    parts.push(`shadowsocks=${host}:${port}`,
      "method=" + (node.cipher || "aes-256-cfb"),
      "password=" + (node.password || ""),
      "ssr-protocol=" + (node.protocol || "origin"));
    if (node["protocol-param"]) {
      parts.push("ssr-protocol-param=" + node["protocol-param"]);
    }
    parts.push("obfs=" + (node.obfs || "plain"));
    if (node["obfs-param"]) parts.push("obfs-host=" + node["obfs-param"]);
  } else if (t === "vmess") {
    const method = !node.cipher || node.cipher === "auto"
      ? "chacha20-ietf-poly1305" : node.cipher;
    parts.push(`vmess=${host}:${port}`, "method=" + method,
      "password=" + (node.uuid || ""));
    if (intOr(node.alterId, 0) !== 0) parts.push("aead=false");
    if (!obfsParams(!!node.tls || !!ro)) return null;
    realityParams();
    if (scv) parts.push("tls-verification=false");
  } else if (t === "vless") {
    parts.push(`vless=${host}:${port}`, "method=none",
      "password=" + (node.uuid || ""));
    if (!obfsParams(!!node.tls || !!ro)) return null;
    realityParams();
    if (node.flow) parts.push("vless-flow=" + node.flow);
    if (scv) parts.push("tls-verification=false");
  } else if (t === "trojan") {
    parts.push(`trojan=${host}:${port}`,
      "password=" + (node.password || ""));
    if (net === "ws") {
      // sample.conf: trojan over WS uses obfs=wss and must not also
      // carry over-tls / tls-host.
      parts.push("obfs=wss");
      const h = wsHostOf(node) || sni;
      if (h) parts.push("obfs-host=" + h);
      if (wsPathOf(node)) parts.push("obfs-uri=" + wsPathOf(node));
      realityParams();
    } else if (net === "tcp") {
      parts.push("over-tls=true");
      if (sni) parts.push("tls-host=" + sni);
      realityParams();
      if (scv) parts.push("tls-verification=false");
    } else {
      return null;
    }
  } else if (t === "anytls") {
    parts.push(`anytls=${host}:${port}`,
      "password=" + (node.password || ""), "over-tls=true");
    if (sni) parts.push("tls-host=" + sni);
    realityParams();
    if (scv) parts.push("tls-verification=false");
  } else if (t === "socks5") {
    parts.push(`socks5=${host}:${port}`);
    if (node.username) parts.push("username=" + node.username);
    if (node.password) parts.push("password=" + node.password);
    if (node.tls) {
      parts.push("over-tls=true");
      if (sni) parts.push("tls-host=" + sni);
      realityParams();
      if (scv) parts.push("tls-verification=false");
    }
  } else if (t === "http") {
    parts.push(`http=${host}:${port}`);
    if (node.username) parts.push("username=" + node.username);
    if (node.password) parts.push("password=" + node.password);
    if (node.tls) {
      parts.push("over-tls=true");
      if (sni) parts.push("tls-host=" + sni);
      realityParams();
      if (scv) parts.push("tls-verification=false");
    }
  } else {
    // hysteria2, tuic, snell, wireguard, ... — Quantumult X cannot
    // express them; skip.
    return null;
  }
  if (node.tfo === true) parts.push("fast-open=true");
  if (node.udp === true) parts.push("udp-relay=true");
  return parts.join(", ");
}

// ------------------------------------------------------- text assembling
const TEXT_EMITTERS = { surge: surgeEmit, loon: loonEmit, quanx: quanxEmit };

function renderPairs(target, nodes, rename) {
  const emit = TEXT_EMITTERS[target];
  const out = [];
  for (const n of nodes) {
    const body = emit(n);
    if (body === null) continue;
    out.push({ name: txtName(rename ? rename(n.name) : n.name), body });
  }
  return out;
}

const PRIVATE_RULES = [
  ["10.0.0.0/8"], ["100.64.0.0/10"], ["127.0.0.0/8"],
  ["172.16.0.0/12"], ["192.168.0.0/16"],
];

function assembleSurge(entries, exits) {
  const lines = [
    "# Generated by subscription-chain-converter (native Surge renderer)",
    "[General]", "loglevel = notify", "", "[Proxy]", "DIRECT = direct",
  ];
  for (const p of entries || []) lines.push(`${p.name} = ${p.body}`);
  for (const p of exits) {
    lines.push(`${p.name} = ${p.body}` +
      (entries ? `, underlying-proxy=${ENTRY_AUTO}` : ""));
  }
  const en = (entries || []).map((p) => p.name);
  const xn = exits.map((p) => p.name);
  const all = [...en, ...xn];
  lines.push("", "[Proxy Group]");
  if (entries) {
    lines.push(`${ENTRY_AUTO} = url-test, ${en.join(", ")}, ` +
      `url=${TEST_URL}, interval=30, tolerance=100`);
    lines.push(`${EXIT_AUTO} = url-test, ${xn.join(", ")}, ` +
      `url=${TEST_URL}, interval=30, tolerance=100`);
  }
  lines.push("Proxy = select, " +
    (entries ? `${EXIT_AUTO}, ${ENTRY_AUTO}, ` : "") +
    `${AUTO_GROUP}, ${all.join(", ")}, DIRECT`);
  lines.push(`${AUTO_GROUP} = url-test, ${xn.join(", ")}, ` +
    `url=${TEST_URL}, interval=30, tolerance=100`);
  lines.push("", "[Rule]");
  for (const [cidr] of PRIVATE_RULES) {
    lines.push(`IP-CIDR,${cidr},DIRECT,no-resolve`);
  }
  lines.push("IP-CIDR6,::1/128,DIRECT,no-resolve",
    "GEOIP,CN,DIRECT", "FINAL,Proxy");
  return lines.join("\n") + "\n";
}

function assembleLoon(entries, exits) {
  const lines = [
    "# Generated by subscription-chain-converter (native Loon renderer)",
    "[Proxy]",
  ];
  for (const p of entries || []) lines.push(`${p.name} = ${p.body}`);
  for (const p of exits) lines.push(`${p.name} = ${p.body}`);
  const en = (entries || []).map((p) => p.name);
  const xn = exits.map((p) => p.name);
  const all = [...en, ...xn];
  if (entries) {
    // Loon's native chaining is a Chain policy (Loon 3.1+): the
    // hops are traversed in listed order, entry group first, exit
    // group second — the same shape as the clash dialer-proxy
    // layout, expressed with Loon's own mechanism.
    lines.push("", "[Proxy Chain]",
      `${CHAIN_GROUP} = ${ENTRY_AUTO},${EXIT_AUTO},udp=true`);
  }
  lines.push("", "[Proxy Group]");
  if (entries) {
    lines.push(`${ENTRY_AUTO} = url-test,${en.join(",")},` +
      `url=${TEST_URL},interval=30,tolerance=100`);
    lines.push(`${EXIT_AUTO} = url-test,${xn.join(",")},` +
      `url=${TEST_URL},interval=30,tolerance=100`);
  }
  lines.push("Proxy = select," +
    (entries ? `${CHAIN_GROUP},${EXIT_AUTO},${ENTRY_AUTO},` : "") +
    `${AUTO_GROUP},${all.join(",")},DIRECT`);
  lines.push(`${AUTO_GROUP} = url-test,${xn.join(",")},` +
    `url=${TEST_URL},interval=30,tolerance=100`);
  lines.push("", "[Rule]");
  for (const [cidr] of PRIVATE_RULES) {
    lines.push(`IP-CIDR,${cidr},DIRECT,no-resolve`);
  }
  lines.push("IP-CIDR6,::1/128,DIRECT,no-resolve",
    "GEOIP,CN,DIRECT", "FINAL,Proxy");
  return lines.join("\n") + "\n";
}

function assembleQuanx(entries, exits) {
  const lines = [
    "# Generated by subscription-chain-converter (native Quantumult X renderer)",
    "[general]", `server_check_url = ${TEST_URL}`, "", "[server_local]",
  ];
  for (const p of entries || []) lines.push(`${p.body}, tag=${p.name}`);
  for (const p of exits) {
    lines.push(`${p.body}` +
      (entries ? `, via-server=${ENTRY_AUTO}` : "") +
      `, tag=${p.name}`);
  }
  const en = (entries || []).map((p) => p.name);
  const xn = exits.map((p) => p.name);
  const all = [...en, ...xn];
  lines.push("", "[policy]");
  if (entries) {
    lines.push(`url-latency-benchmark=${ENTRY_AUTO}, ${en.join(", ")}, ` +
      "check-interval=30, tolerance=100");
    lines.push(`url-latency-benchmark=${EXIT_AUTO}, ${xn.join(", ")}, ` +
      "check-interval=30, tolerance=100");
  }
  lines.push("static=Proxy, " +
    (entries ? `${EXIT_AUTO}, ${ENTRY_AUTO}, ` : "") +
    `${AUTO_GROUP}, ${all.join(", ")}, direct`);
  lines.push(`url-latency-benchmark=${AUTO_GROUP}, ${xn.join(", ")}, ` +
    "check-interval=30, tolerance=100");
  lines.push("", "[filter_local]");
  for (const [cidr] of PRIVATE_RULES) {
    lines.push(`ip-cidr, ${cidr}, direct`);
  }
  lines.push("ip6-cidr, ::1/128, direct", "geoip, cn, direct",
    "final, Proxy");
  return lines.join("\n") + "\n";
}

const TEXT_ASSEMBLERS = {
  surge: assembleSurge, loon: assembleLoon, quanx: assembleQuanx,
};

const TEXT_FORMAT_NAMES = {
  surge: "Surge", loon: "Loon", quanx: "Quantumult X",
};

function buildTextPlain(target, nodes) {
  if (target === "v2ray") {
    const links = [];
    for (const n of nodes) {
      const link = nodeToShareLink(n);
      if (link) links.push(link);
    }
    if (!links.length) {
      throw new Error("没有可输出为分享链接的节点");
    }
    return [textToB64(links.join("\n") + "\n"),
      "text/plain; charset=utf-8"];
  }
  const pairs = renderPairs(target, nodes, null);
  if (!pairs.length) {
    throw new Error(`没有 ${TEXT_FORMAT_NAMES[target]} 可用的节点` +
      "（该客户端不支持所给协议）");
  }
  return [TEXT_ASSEMBLERS[target](null, pairs),
    "text/plain; charset=utf-8"];
}

async function mergeTextChain(target, entryItems, exitItems) {
  if (target === "v2ray") {
    // Share links have no chaining concept (no dialer-proxy, no
    // group indirection): a chain request degrades to the plain
    // link set of the EXIT tier — the entry hop is dropped, the
    // exit endpoints stay reachable. Entries are not even fetched.
    STAGE.cur = "exit-convert";
    const xnodes = chainPool(await gather(exitItems));
    if (!xnodes.length) throw new Error("没有可用节点");
    STAGE.cur = "merge";
    return buildTextPlain("v2ray", xnodes);
  }
  STAGE.cur = "entry-convert";
  const enodes = chainPool(await gather(entryItems));
  if (!enodes.length) throw new Error("没有可用节点");
  STAGE.cur = "exit-convert";
  const xnodes = chainPool(await gather(exitItems));
  if (!xnodes.length) throw new Error("没有可用节点");
  STAGE.cur = "merge";
  const entries = renderPairs(target, enodes,
    (name) => clashPrefixedName("入口-", name));
  const exits = renderPairs(target, xnodes,
    (name) => clashPrefixedName("出口-", name));
  if (!entries.length || !exits.length) {
    throw new Error(`没有 ${TEXT_FORMAT_NAMES[target]} 可用的` +
      "入口或出口节点（该客户端不支持所给协议）");
  }
  return [TEXT_ASSEMBLERS[target](entries, exits),
    "text/plain; charset=utf-8"];
}

function buildChainFor(target, entry, exit_, origin) {
  if (target === "singbox") return mergeSingbox(entry, exit_, origin);
  if (target === "clash") return mergeClash(entry, exit_, origin);
  return mergeTextChain(target, entry, exit_);
}

// ------------------------------------------------------- own rule system
// The chain configs are assembled from the bundled skeletons (copied
// verbatim from the VPS backend): groups, rules, DNS and sniffer are
// frozen, and every rule file is an official source (MetaCubeX
// meta-rules-dat for mihomo, SagerNet sing-geosite / sing-geoip for
// sing-box) served from this deployment's own KV mirror under /rules/.
// The __PUBLIC_ORIGIN__ placeholder inside the skeletons is replaced
// with the request origin at generation time.
function materialize(raw, origin) {
  return JSON.parse(JSON.stringify(raw).replaceAll("__PUBLIC_ORIGIN__", origin));
}

function fillMembers(mem, entryNames, exitNames) {
  if (Array.isArray(mem) && mem.length === 1 && MEMBER_TOKENS.has(mem[0])) {
    if (mem[0] === "@ENTRIES@") return [...entryNames];
    if (mem[0] === "@EXITS@") return [...exitNames];
    return [...entryNames, ...exitNames];
  }
  return mem;
}

function isRegionalIndicator(ch) {
  const cp = ch.codePointAt(0);
  return cp >= 0x1F1E6 && cp <= 0x1F1FF;
}

function clashPrefixedName(prefix, name) {
  // Prefix a clash node name the way the override script's name
  // normalization leaves it: a leading flag emoji stays first and the
  // prefix becomes the second word ("🇺🇸 出口- 美国 ...").
  name = name || "";
  const cps = [...name];
  if (cps.length >= 2 && isRegionalIndicator(cps[0]) &&
    isRegionalIndicator(cps[1])) {
    return cps[0] + cps[1] + " " + prefix + cps.slice(2).join("");
  }
  return prefix + name;
}

function sbLeafFix(o) {
  // Per-node normalization the sing-box overlay script applies:
  // domain_resolver is repointed at the skeleton's CN DNS (any legacy
  // domain_strategy is folded into it and dropped), TCP keep-alive
  // defaults are set on non-endpoint outbounds, and a stray name field
  // differing from the tag is removed.
  const st = String(o.domain_strategy || "");
  const cur = o.domain_resolver;
  if (isObj(cur)) {
    cur.server = "dns-cn";
    if (st && !cur.strategy) cur.strategy = st;
  } else if (cur || st) {
    o.domain_resolver = st ? { server: "dns-cn", strategy: st } : "dns-cn";
  }
  delete o.domain_strategy;
  if (o.type !== "wireguard") {
    o.tcp_keep_alive = "60s";
    if (!o.tcp_keep_alive_interval) o.tcp_keep_alive_interval = "60s";
  }
  if (o.name && o.name !== o.tag) delete o.name;
  return o;
}

function ownClashChain(eprox, xprox, origin) {
  const sk = materialize(skeletonClash, origin);
  const entries = [], exits = [];
  for (const p of eprox) {
    const q = { ...p };
    q.name = clashPrefixedName("入口-", q.name);
    entries.push(q);
  }
  for (const p of xprox) {
    const q = { ...p };
    q.name = clashPrefixedName("出口-", q.name);
    q["dialer-proxy"] = ENTRY_AUTO;
    exits.push(q);
  }
  const en = entries.map((p) => p.name);
  const xn = exits.map((p) => p.name);
  const specials = (sk.proxies || []).filter((x) => x !== "@NODES@");
  sk.proxies = [...entries, ...exits, ...specials];
  for (const g of sk["proxy-groups"] || []) {
    g.proxies = fillMembers(g.proxies, en, xn);
  }
  return [yamlDump(sk, { noRefs: true, lineWidth: 80 }),
    "text/yaml; charset=utf-8"];
}

function ownSingboxChain(enodes, xnodes, origin) {
  const sk = materialize(skeletonSingbox, origin);
  const entries = [], exits = [];
  for (const o0 of enodes) {
    const o = sbLeafFix({ ...o0 });
    delete o.detour;
    o.tag = "入口-" + o.tag;
    entries.push(o);
  }
  for (const o0 of xnodes) {
    const o = sbLeafFix({ ...o0 });
    o.tag = "出口-" + o.tag;
    o.detour = ENTRY_AUTO;
    exits.push(o);
  }
  const en = entries.map((o) => o.tag);
  const xn = exits.map((o) => o.tag);
  const out = [];
  for (const o of sk.outbounds || []) {
    if (o.type === "@nodes@") {
      out.push(...entries, ...exits);
      continue;
    }
    if ("outbounds" in o) o.outbounds = fillMembers(o.outbounds, en, xn);
    out.push(o);
  }
  sk.outbounds = out;
  return [JSON.stringify(sk, null, 2), "application/json; charset=utf-8"];
}

// ------------------------------------------------------------- ECH fix
function echQueryNames(cfg) {
  // ECH query names that need a live DNS HTTPS fetch at dial time:
  // outbounds/endpoints whose tls.ech has no inline config list.
  const names = [];
  for (const key of ["outbounds", "endpoints"]) {
    for (const o of cfg[key] || []) {
      if (!isObj(o)) continue;
      const tls = o.tls || {};
      const ech = tls.ech || {};
      if (!isObj(ech) || !Object.keys(ech).length) continue;
      if (ech.enabled === false) continue;
      let q = String(ech.query_server_name || ech["query-server-name"] || "").trim();
      if (!q && !ech.config) q = String(tls.server_name || "").trim();
      if (q && !names.includes(q)) names.push(q);
    }
  }
  return names;
}

async function fetchEchConfig(name) {
  // Fetch the live ECHConfigList for a query name via AliDNS DoH (JSON
  // API), generation-side where the network is clean. The HTTPS
  // record's TTL is about a minute, so a phone-side fetch lands on
  // nearly every fresh chained connection; inlining the config at
  // generation time removes that round trip from the dial path.
  if (ECH_CFG_CACHE.has(name)) return ECH_CFG_CACHE.get(name);
  let result = null;
  try {
    const url = "https://dns.alidns.com/resolve?name=" +
      encodeURIComponent(name) + "&type=HTTPS";
    const resp = await fetch(url, {
      headers: { Accept: "application/dns-json", "User-Agent": BROWSER_UA },
      signal: AbortSignal.timeout(6000),
    });
    const data = await resp.json();
    for (const ans of data.Answer || []) {
      const text = String(ans.data || "");
      if (text.includes('ech="')) {
        result = text.split('ech="', 2)[1].split('"', 1)[0] || null;
        if (result) break;
        result = null;
      }
    }
  } catch {
    result = null;
  }
  ECH_CFG_CACHE.set(name, result);
  return result;
}

async function ensureEchRoute(cfg) {
  // ECH self-sufficiency for generated full configs: airport entry
  // nodes carry ECH whose config list is fetched with a DNS HTTPS
  // query at dial time, but the generated DNS rules reject HTTPS/SVCB
  // queries wholesale, so every chained dial would die with
  // "fetch ECH config list: REFUSED". The current ECHConfigList is
  // inlined into each ECH outbound at generation time, a dedicated
  // AliDNS DoH server detoured via a plain direct outbound serves as
  // the fallback route, and a prepended domain rule routes the ECH
  // names to it (before the reject rule).
  const names = echQueryNames(cfg);
  if (!names.length) return cfg;
  for (const key of ["outbounds", "endpoints"]) {
    for (const o of cfg[key] || []) {
      if (!isObj(o)) continue;
      const ech = (o.tls || {}).ech || {};
      if (!isObj(ech) || !Object.keys(ech).length) continue;
      if (ech.enabled === false || ech.config) continue;
      const q = String(ech.query_server_name || ech["query-server-name"] || "").trim();
      if (!q) continue;
      const fetched = await fetchEchConfig(q);
      if (fetched) {
        // sing-box wants the ECHConfigList PEM-armored; the label
        // must be "ECH CONFIGS" (with the space, hard-checked in
        // sing-box's source) or it refuses to start.
        const chunks = [];
        for (let i = 0; i < fetched.length; i += 64) {
          chunks.push(fetched.slice(i, i + 64));
        }
        ech.config = ["-----BEGIN ECH CONFIGS-----\n" + chunks.join("\n") +
          "\n-----END ECH CONFIGS-----"];
      }
    }
  }
  const outs = cfg.outbounds || (cfg.outbounds = []);
  let bypass = null;
  for (const o of outs) {
    if (isObj(o) && o.type === "direct" && o.tag) {
      if (String(o.tag).toLowerCase() === "direct") {
        bypass = o;
        break;
      }
      if (bypass === null) bypass = o;
    }
  }
  if (bypass === null) {
    bypass = { type: "direct", tag: "direct", connect_timeout: "8s" };
    outs.push(bypass);
  } else if (!["connect_timeout", "domain_resolver", "override_address",
    "override_port", "proxy_protocol"].some((k) => k in bypass)) {
    // An empty direct outbound is not a valid detour target.
    bypass.connect_timeout = "8s";
  }
  const dns = cfg.dns || (cfg.dns = {});
  const servers = dns.servers || (dns.servers = []);
  let tag = null;
  for (const s of servers) {
    if (isObj(s) && String(s.tag || "").startsWith("ech-")) {
      tag = s.tag;
      s.detour = bypass.tag;
      break;
    }
  }
  if (tag === null) {
    tag = "ech-dns";
    if (!servers.some((s) => isObj(s) && s.tag === tag)) {
      servers.push({
        type: "https", tag: "ech-dns", server: "223.5.5.5",
        server_port: 443, path: "/dns-query",
        tls: { enabled: true, server_name: "dns.alidns.com" },
        detour: bypass.tag,
      });
    }
  }
  const rules = dns.rules || (dns.rules = []);
  const covered = new Set();
  for (const r of rules) {
    if (isObj(r) && r.server === tag) {
      if (typeof r.domain === "string") covered.add(r.domain.toLowerCase());
      else if (Array.isArray(r.domain)) {
        for (const x of r.domain) covered.add(String(x).toLowerCase());
      }
    }
  }
  const missing = names.filter((n) => !covered.has(n.toLowerCase()));
  if (missing.length) {
    rules.unshift({ domain: missing, action: "route", server: tag });
  }
  return cfg;
}

async function echFixBody(body) {
  let cfg;
  try {
    cfg = JSON.parse(body);
  } catch {
    return body;
  }
  if (echQueryNames(cfg).length) {
    await ensureEchRoute(cfg);
    return JSON.stringify(cfg, null, 2);
  }
  return body;
}

// ------------------------------------------------------------------ merges

function chainGlyphName(name) {
  const base = name.startsWith("\u267b") ? name.slice(2).trimStart() : name;
  return "\u26d3 " + base;
}

function markChainGroupsClash(cfg) {
  // Give every group that routes purely through chained exits the
  // chain glyph: a group counts when every member is an exit proxy
  // (carries dialer-proxy). Selectors of groups and the mixed manual
  // group keep their names; references are rewritten to match.
  const exits = new Set((cfg.proxies || [])
    .filter((p) => isObj(p) && p["dialer-proxy"]).map((p) => p.name));
  const groups = cfg["proxy-groups"] || [];
  if (!exits.size || !groups.length) return cfg;
  const existing = new Set(groups.map((g) => g && g.name));
  const ren = new Map();
  for (const g of groups) {
    if (!isObj(g)) continue;
    const name = g.name || "";
    const mem = (g.proxies || []).filter((m) => typeof m === "string");
    if (!mem.length || name.startsWith("\u26d3") ||
        !mem.every((m) => exits.has(m))) continue;
    const nw = chainGlyphName(name);
    if (!existing.has(nw)) {
      ren.set(name, nw);
      g.name = nw;
      existing.add(nw);
    }
  }
  const chainParams = { url: "https://www.gstatic.com/generate_204",
    interval: 30, tolerance: 100, lazy: false, timeout: 5000,
    "max-failed-times": 3 };
  const entriesC = new Set((cfg.proxies || [])
    .filter((p) => isObj(p) && !p["dialer-proxy"]).map((p) => p.name));
  for (const g of groups) {
    if (!isObj(g)) continue;
    const mem = (g.proxies || []).filter((m) => typeof m === "string");
    if (["url-test", "fallback", "load-balance"].includes(g.type) &&
        mem.length &&
        (mem.every((m) => exits.has(m)) ||
         mem.every((m) => entriesC.has(m)))) {
      Object.assign(g, chainParams);
    }
    if (g.name === "默认代理" && Array.isArray(g.proxies) &&
        g.proxies.includes(EXIT_AUTO)) {
      g.proxies = [EXIT_AUTO,
        ...g.proxies.filter((m) => m !== EXIT_AUTO)];
    }
  }
  if (!ren.size) return cfg;
  for (const g of groups) {
    if (isObj(g) && Array.isArray(g.proxies)) {
      g.proxies = g.proxies.map((m) => ren.get(m) ?? m);
    }
  }
  if (Array.isArray(cfg.rules)) {
    cfg.rules = cfg.rules.map((r) => {
      if (typeof r !== "string" || !r.includes(",")) return r;
      const parts = r.split(",");
      const idx = parts[parts.length - 1].trim() === "no-resolve"
        ? parts.length - 2 : parts.length - 1;
      const tgt = parts[idx].trim();
      if (ren.has(tgt)) {
        parts[idx] = ren.get(tgt);
        return parts.join(",");
      }
      return r;
    });
  }
  return cfg;
}

function finishChainClash(body) {
  try {
    const cfg = yamlLoad(body);
    if (isObj(cfg)) {
      markChainGroupsClash(cfg);
      return yamlDump(cfg, { noRefs: true, lineWidth: 80 });
    }
  } catch {
    /* fail open: serve the unmarked config */
  }
  return body;
}

function markChainGroupsSingbox(cfg) {
  const exits = new Set((cfg.outbounds || [])
    .filter((o) => isObj(o) && o.detour).map((o) => o.tag));
  const obs = cfg.outbounds || [];
  if (!exits.size || !obs.length) return cfg;
  const existing = new Set(obs.map((o) => o && o.tag));
  const ren = new Map();
  for (const o of obs) {
    if (!isObj(o)) continue;
    const tag = o.tag || "";
    const mem = (o.outbounds || []).filter((m) => typeof m === "string");
    if (!mem.length || tag.startsWith("\u26d3") ||
        !mem.every((m) => exits.has(m))) continue;
    const nw = chainGlyphName(tag);
    if (!existing.has(nw)) {
      ren.set(tag, nw);
      o.tag = nw;
      existing.add(nw);
    }
  }
  const entriesS = new Set(obs
    .filter((o) => isObj(o) && !o.detour && !("outbounds" in o))
    .map((o) => o.tag));
  for (const o of obs) {
    if (!isObj(o)) continue;
    const mem = (o.outbounds || []).filter((m) => typeof m === "string");
    if (o.type === "urltest" && mem.length &&
        (mem.every((m) => exits.has(m)) ||
         mem.every((m) => entriesS.has(m)))) {
      o.interval = "30s";
      o.tolerance = 100;
    }
    if (o.tag === "默认代理" && Array.isArray(o.outbounds) &&
        o.outbounds.includes(EXIT_AUTO)) {
      o.outbounds = [EXIT_AUTO,
        ...o.outbounds.filter((m) => m !== EXIT_AUTO)];
    }
  }
  if (!ren.size) return cfg;
  for (const o of obs) {
    if (!isObj(o)) continue;
    if (Array.isArray(o.outbounds)) {
      o.outbounds = o.outbounds.map((m) => ren.get(m) ?? m);
    }
    if (ren.has(o.detour)) o.detour = ren.get(o.detour);
  }
  const route = cfg.route || {};
  if (ren.has(route.final)) route.final = ren.get(route.final);
  for (const r of route.rules || []) {
    if (isObj(r) && ren.has(r.outbound)) r.outbound = ren.get(r.outbound);
  }
  return cfg;
}

function finishChainSingbox(body) {
  try {
    const cfg = JSON.parse(body);
    if (isObj(cfg)) {
      markChainGroupsSingbox(cfg);
      return JSON.stringify(cfg, null, 2);
    }
  } catch {
    /* fail open: serve the unmarked config */
  }
  return body;
}

// Chain pools never contain built-in endpoints: a source config's
// direct / reject entries are configuration artifacts, not nodes —
// as exits they would break the two-hop lock (an exit picked as
// DIRECT leaves the chain at the entry side), and as entries they
// silently degrade the chain to one hop.
function chainPool(nodes) {
  return nodes.filter((n) => {
    const t = String(n.type ?? "").toLowerCase();
    return t !== "direct" && t !== "reject";
  });
}

async function mergeSingbox(entryItems, exitItems, origin) {
  STAGE.cur = "entry-convert";
  const enodesRaw = chainPool(await gather(entryItems));
  if (!enodesRaw.length) throw new Error("没有可用节点");
  const enodes = enodesRaw.map(sbEmit);
  STAGE.cur = "exit-convert";
  const xnodesRaw = chainPool(await gather(exitItems));
  if (!xnodesRaw.length) throw new Error("没有可用节点");
  const xnodes = xnodesRaw.map(sbEmit);
  STAGE.cur = "merge";
  if (!enodes.length || !xnodes.length) {
    throw new Error("入口或出口没有可用节点");
  }
  const built = ownSingboxChain(enodes, xnodes, origin);
  return [await echFixBody(finishChainSingbox(built[0])), built[1]];
}

async function mergeClash(entryItems, exitItems, origin) {
  STAGE.cur = "entry-convert";
  const eproxRaw = chainPool(await gather(entryItems));
  if (!eproxRaw.length) throw new Error("没有可用节点");
  const eprox = eproxRaw.map(clashEmit);
  STAGE.cur = "exit-convert";
  const xproxRaw = chainPool(await gather(exitItems));
  if (!xproxRaw.length) throw new Error("没有可用节点");
  const xprox = xproxRaw.map(clashEmit);
  STAGE.cur = "merge";
  if (!eprox.length || !xprox.length) {
    throw new Error("入口或出口没有可用节点");
  }
  const built = ownClashChain(eprox, xprox, origin);
  return [finishChainClash(built[0]), built[1]];
}

// ------------------------------------------------------- plain conversion
// Plain (non-chain) clash / sing-box conversions are assembled from
// the same own skeleton with the entry tier removed: nodes form the
// exit/manual tiers and the ⛓ 入口优选 group (and every reference to
// it) is dropped. The four text targets are rendered natively by the
// renderers above (buildTextPlain), so no target needs an external
// subconverter anymore.
async function buildConfig(target, items, origin) {
  const nodes = await gather(items);
  if (!nodes.length) throw new Error("没有可用节点");
  if (TEXT_TARGETS.has(target)) return buildTextPlain(target, nodes);
  // Plain clash / sing-box conversions follow the HiClash script's
  // design: info nodes are filtered out and names normalized before
  // anything is emitted (chain conversions keep their own pipeline).
  const plain = preparePlainNodes(nodes);
  if (!plain.nodes.length) throw new Error("没有可用节点");
  if (target === "singbox") {
    const emitted = plain.nodes.map((n) => {
      const o = sbLeafFix(sbEmit(n));
      delete o.detour;
      return o;
    });
    const tags = emitted.map((o) => o.tag);
    const sk = materialize(skeletonSingbox, origin);
    const out = [];
    for (const o of sk.outbounds || []) {
      if (o.type === "@nodes@") {
        out.push(...emitted);
        continue;
      }
      if ("outbounds" in o) o.outbounds = fillMembers(o.outbounds, [], tags);
      out.push(o);
    }
    // Plain mode has no chain tiers at all (the script design has
    // none): both tier outbounds are dropped and every reference to
    // them is stripped; a selector whose default pointed at a tier
    // falls back to its first member.
    const sbOut = out.filter(
      (o) => o.tag !== ENTRY_AUTO && o.tag !== EXIT_AUTO);
    for (const g of sbOut) {
      if (Array.isArray(g.outbounds)) {
        g.outbounds = g.outbounds.filter(
          (m) => m !== ENTRY_AUTO && m !== EXIT_AUTO);
      }
      if ((g.default === ENTRY_AUTO || g.default === EXIT_AUTO) &&
          Array.isArray(g.outbounds) && g.outbounds.length) {
        g.default = g.outbounds[0];
      }
    }
    // Region pairs (geographic + rate / home + catch-all), inserted
    // before the first group outbound so they rank first;
    // region selectors lead 默认代理,
    // join every service selector, and join GLOBAL as pairs.
    const sbPlan = regionPlan(tags);
    const sbPairs = [];
    const addSbPair = (rname, members) => {
      const autoTag = `${rname}-自动选择`;
      sbPairs.push({
        type: "urltest", tag: autoTag, outbounds: members,
        url: "https://www.gstatic.com/generate_204", interval: "1m",
        tolerance: 100, interrupt_exist_connections: false,
      });
      sbPairs.push({
        type: "selector", tag: rname,
        outbounds: [autoTag, ...members],
        interrupt_exist_connections: false,
      });
    };
    for (const p of sbPlan.pairs) addSbPair(p.name, p.members);
    if (sbPairs.length) {
      const sbAt = sbOut.findIndex((o) => Array.isArray(o.outbounds));
      sbOut.splice(sbAt < 0 ? sbOut.length : sbAt, 0, ...sbPairs);
      const SB_NO_APPEND = new Set(["GLOBAL", "默认代理", "手动选择",
        "自动选择", "AdBlock", "远控工具", "直连"]);
      for (const g of sbOut) {
        if (!Array.isArray(g.outbounds)) continue;
        if (g.tag === "默认代理") {
          g.outbounds = [...sbPlan.selectNames, ...g.outbounds];
        } else if (g.tag === "GLOBAL") {
          g.outbounds = [...g.outbounds,
            ...sbPlan.pairNames.filter((t) => !g.outbounds.includes(t))];
        } else if (!SB_NO_APPEND.has(g.tag) &&
                   !sbPlan.pairNames.includes(g.tag) &&
                   g.type === "selector") {
          g.outbounds = [...g.outbounds,
            ...sbPlan.selectNames.filter((t) => !g.outbounds.includes(t))];
        }
        if (g.default && !g.outbounds.includes(g.default)) {
          g.default = g.outbounds[0];
        }
      }
    }
    sk.outbounds = sbOut;
    return [JSON.stringify(sk, null, 2), "application/json; charset=utf-8"];
  }
  const proxies = plain.nodes.map((n) => {
    const p = clashEmit(n);
    // Repair dialer-proxy references that pointed at renamed nodes.
    if (p["dialer-proxy"] && plain.renameMap.has(p["dialer-proxy"])) {
      p["dialer-proxy"] = plain.renameMap.get(p["dialer-proxy"]);
    }
    return p;
  });
  const names = proxies.map((p) => String(p.name));
  const sk = materialize(skeletonClash, origin);
  const specials = (sk.proxies || []).filter((x) => x !== "@NODES@");
  sk.proxies = [...proxies, ...specials];
  const groups = [];
  for (const g of sk["proxy-groups"] || []) {
    // Plain mode has no chain tiers (the script design has none):
    // both tier groups are dropped and references stripped.
    if (g.name === ENTRY_AUTO || g.name === EXIT_AUTO) continue;
    g.proxies = fillMembers(g.proxies, [], names);
    if (Array.isArray(g.proxies)) {
      g.proxies = g.proxies.filter(
        (m) => m !== ENTRY_AUTO && m !== EXIT_AUTO);
    }
    groups.push(g);
  }
  // Region pairs (geographic + rate / home + catch-all) in the
  // script's createRegionGroup shape, placed at the very front of
  // the group list (region groups rank first); region
  // selectors lead 默认代理, join every service group and 漏网之鱼,
  // and join GLOBAL as auto+select pairs. (Per the user's standing
  // instruction the auto group is each region selector's default —
  // first member — where the script lists it last.)
  const plan = regionPlan(names);
  const regionGroups = [];
  for (const p of plan.pairs) {
    const autoName = `${p.name}-自动选择`;
    regionGroups.push({
      name: autoName, type: "url-test", interval: 600, timeout: 3000,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true, "max-failed-times": 3, "empty-fallback": "REJECT",
      tolerance: 50, "exclude-type": "DIRECT", icon: AUTO_ICON,
      hidden: true, proxies: p.members,
    });
    const sel = {
      name: p.name, type: "select", interval: 600, timeout: 3000,
      url: "https://www.apple.com/library/test/success.html",
      lazy: true, "max-failed-times": 3, "empty-fallback": "REJECT",
      proxies: [autoName, ...p.members],
    };
    if (p.icon) sel.icon = p.icon;
    regionGroups.push(sel);
  }
  if (regionGroups.length) {
    groups.unshift(...regionGroups);
    const NO_APPEND = new Set(["GLOBAL", "默认代理", "手动选择",
      "自动选择", "负载均衡", "故障转移", "直连", "AdBlock", "远控工具"]);
    for (const g of groups) {
      if (!Array.isArray(g.proxies)) continue;
      if (g.name === "默认代理") {
        g.proxies = [...plan.selectNames, ...g.proxies];
      } else if (g.name === "GLOBAL") {
        g.proxies = [...g.proxies,
          ...plan.pairNames.filter((n) => !g.proxies.includes(n))];
      } else if (!NO_APPEND.has(g.name) &&
                 !plan.pairNames.includes(g.name)) {
        g.proxies = [...g.proxies,
          ...plan.selectNames.filter((n) => !g.proxies.includes(n))];
      }
    }
  }
  sk["proxy-groups"] = groups;
  return [yamlDump(sk, { noRefs: true, lineWidth: 80 }),
    "text/yaml; charset=utf-8"];
}

// ------------------------------------------------------------- short links
// Generated subscription URLs used to embed the original entry/exit
// subscription URLs (tokens included) in plaintext. A short link
// keeps only an opaque code in the URL; the mapping lives in KV.
async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", _enc.encode(text));
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

function linkIdentity(record) {
  // A link's identity is its content only (kind + entry/exit, resp.
  // kind + url). The target format is NOT part of the identity; the
  // /m/ vs /s/ path letter picks it at fetch time.
  return JSON.stringify([
    record.kind ?? null, record.entry ?? null,
    record.exit ?? null, record.url ?? null,
  ]);
}

function samePayload(a, b) {
  return isObj(a) && isObj(b) &&
    (a.kind ?? null) === (b.kind ?? null) &&
    (a.entry ?? null) === (b.entry ?? null) &&
    (a.exit ?? null) === (b.exit ?? null) &&
    (a.url ?? null) === (b.url ?? null);
}

function validCode(code) {
  // User-chosen codes accept the full ASCII letter/digit set (the
  // random generator's alphabet is narrower on purpose, dropping
  // look-alike characters, but users will type 0/1/i/l/o).
  const cps = [...String(code)];
  return cps.length >= 3 && cps.length <= 32 &&
    cps.every((ch) => CODE_CHARS.includes(ch));
}

function genCode() {
  const L = LINK_ALPHABET.length;
  const limit = 256 - (256 % L);
  const buf = new Uint8Array(1);
  let code = "";
  while (code.length < 10) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) code += LINK_ALPHABET[buf[0] % L];
  }
  return code;
}

// ------------------------------------------------- D1 advanced store
// The links live in D1 when the optional DB binding is present:
// relational rows make the content-hash dedupe a lookup instead of
// a second KV key, and every served short link can be counted.
// Schema is created lazily (CREATE TABLE IF NOT EXISTS) so a
// one-click deployment needs no migration step.
const SQL_LINKS_SCHEMA = [
  "CREATE TABLE IF NOT EXISTS links (" +
  "code TEXT PRIMARY KEY, kind TEXT NOT NULL, target TEXT, " +
  "url TEXT, entry TEXT, exit TEXT, hash TEXT NOT NULL, " +
  "created_at TEXT NOT NULL, hits INTEGER NOT NULL DEFAULT 0)",
  "CREATE INDEX IF NOT EXISTS idx_links_hash ON links(hash)",
  "CREATE TABLE IF NOT EXISTS refresh_log (" +
  "id INTEGER PRIMARY KEY AUTOINCREMENT, time TEXT NOT NULL, " +
  "ok INTEGER NOT NULL, failed TEXT NOT NULL)",
];
const SQL_LINK_BY_CODE =
  "SELECT code, kind, target, url, entry, exit, hits FROM links " +
  "WHERE code = ?";
const SQL_CODE_BY_HASH = "SELECT code FROM links WHERE hash = ?";
const SQL_LINK_INSERT =
  "INSERT INTO links (code, kind, target, url, entry, exit, hash, " +
  "created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
const SQL_LINK_HIT = "UPDATE links SET hits = hits + 1 WHERE code = ?";
const SQL_REFRESH_LOG =
  "INSERT INTO refresh_log (time, ok, failed) VALUES (?, ?, ?)";

let _dbReady = null;
async function ensureDb(env) {
  if (!env.DB) return false;
  if (!_dbReady) {
    _dbReady = (async () => {
      for (const sql of SQL_LINKS_SCHEMA) {
        await env.DB.prepare(sql).run();
      }
      return true;
    })().catch((e) => {
      _dbReady = null;
      throw e;
    });
  }
  return _dbReady;
}

function rowToRecord(row) {
  if (!row) return null;
  const rec = { kind: row.kind, target: row.target };
  if (row.url != null) rec.url = row.url;
  if (row.entry != null) rec.entry = row.entry;
  if (row.exit != null) rec.exit = row.exit;
  rec.hits = row.hits ?? 0;
  return rec;
}

async function dbGetLink(env, code) {
  await ensureDb(env);
  const row = await env.DB.prepare(SQL_LINK_BY_CODE).bind(code).first();
  return rowToRecord(row);
}

async function dbStoreLink(env, record, wantCode, hash) {
  await ensureDb(env);
  const db = env.DB;
  if (wantCode) {
    const existing = await dbGetLink(env, wantCode);
    if (existing) return samePayload(existing, record) ? wantCode : null;
    await db.prepare(SQL_LINK_INSERT).bind(
      wantCode, record.kind, record.target ?? null, record.url ?? null,
      record.entry ?? null, record.exit ?? null, hash,
      new Date().toISOString()).run();
    return wantCode;
  }
  const byHash = await db.prepare(SQL_CODE_BY_HASH).bind(hash).first();
  if (byHash && byHash.code) {
    const rec = await dbGetLink(env, byHash.code);
    if (rec && samePayload(rec, record)) return byHash.code;
  }
  let code = genCode();
  while (await dbGetLink(env, code)) code = genCode();
  await db.prepare(SQL_LINK_INSERT).bind(
    code, record.kind, record.target ?? null, record.url ?? null,
    record.entry ?? null, record.exit ?? null, hash,
    new Date().toISOString()).run();
  return code;
}

async function storeLink(env, record, wantCode) {
  // With wantCode: return it when free or already bound to the same
  // payload, and null when taken by a different payload. Without:
  // reuse the code of an identical payload (via the identity index),
  // else generate a random one. D1 when bound, KV otherwise; a D1
  // failure falls back to KV for that call (reads check D1 first,
  // then KV, so either home resolves).
  const hash = await sha256Hex(linkIdentity(record));
  if (env.DB) {
    try {
      return await dbStoreLink(env, record, wantCode, hash);
    } catch {
      /* fall through to KV */
    }
  }
  if (wantCode) {
    const existing = await env.KV.get("link:" + wantCode, "json");
    if (existing) return samePayload(existing, record) ? wantCode : null;
    await env.KV.put("link:" + wantCode, JSON.stringify(record));
    await env.KV.put("idx:" + hash, wantCode);
    return wantCode;
  }
  const idxKey = "idx:" + hash;
  const existingCode = await env.KV.get(idxKey);
  if (existingCode) {
    const rec = await env.KV.get("link:" + existingCode, "json");
    if (rec && samePayload(rec, record)) return existingCode;
  }
  let code = genCode();
  while (await env.KV.get("link:" + code)) code = genCode();
  await env.KV.put("link:" + code, JSON.stringify(record));
  await env.KV.put(idxKey, code);
  return code;
}

async function getLink(env, code) {
  if (env.DB) {
    try {
      const rec = await dbGetLink(env, code);
      if (rec) return rec;
    } catch {
      /* fall through to KV */
    }
  }
  return env.KV.get("link:" + code, "json");
}

async function bumpLinkHit(env, code) {
  if (!env.DB) return;
  try {
    await ensureDb(env);
    await env.DB.prepare(SQL_LINK_HIT).bind(code).run();
  } catch {
    /* hit counting is best-effort */
  }
}

// ------------------------------------------------------------ rules mirror
function validRule(dst, bytes) {
  if (bytes.length < 64) return false;
  if (dst.endsWith(".svg")) {
    const head = _dec.decode(bytes.slice(0, 2048));
    return head.includes("<svg") || head.trimStart().startsWith("<?xml");
  }
  // Binary rule files must not be an HTML error page in disguise.
  let i = 0;
  while (i < bytes.length &&
    [0x20, 0x09, 0x0a, 0x0d, 0x0b, 0x0c].includes(bytes[i])) i++;
  return !(i < bytes.length && bytes[i] === 0x3c);
}

async function putRule(env, dst, bytes) {
  // R2 (optional RULES binding) is the natural home for the mirror:
  // object storage for large binaries, no KV value-size ceiling.
  // Without it the mirror lives in KV under rule:<dst> as before.
  if (env.RULES) {
    await env.RULES.put(dst, bytes);
    return;
  }
  await env.KV.put("rule:" + dst, bytes);
}

async function getRule(env, dst) {
  // R2 first, KV second: copies mirrored before the R2 tier was
  // enabled keep serving until the next refresh lands them in R2.
  if (env.RULES) {
    try {
      const obj = await env.RULES.get(dst);
      if (obj) return obj.arrayBuffer();
    } catch {
      /* fall through to KV */
    }
  }
  return env.KV.get("rule:" + dst, "arrayBuffer");
}

async function refreshRules(env) {
  // Download every manifest entry from its official source, validate
  // it, and store it in the rule mirror (R2 when bound, else KV).
  // A failed download keeps the previous copy. Status lands in
  // meta:rules_status and, when D1 is bound, in the refresh_log.
  const results = new Map();
  const chunk = 8;
  for (let i = 0; i < MANIFEST.length; i += chunk) {
    const part = MANIFEST.slice(i, i + chunk);
    await Promise.all(part.map(async (entry) => {
      const { dst, src } = entry;
      try {
        const resp = await fetch(src, {
          headers: { "User-Agent": REFRESH_UA },
          signal: AbortSignal.timeout(120000),
        });
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const buf = new Uint8Array(await resp.arrayBuffer());
        if (!validRule(dst, buf)) throw new Error("validation failed");
        await putRule(env, dst, buf);
        results.set(dst, true);
      } catch {
        results.set(dst, false);
      }
    }));
  }
  let ok = 0;
  const failed = [];
  for (const e of MANIFEST) {
    if (results.get(e.dst)) ok++;
    else failed.push(e.dst);
  }
  const status = { time: new Date().toISOString(), ok, failed };
  await env.KV.put("meta:rules_status", JSON.stringify(status));
  if (env.DB) {
    try {
      await ensureDb(env);
      await env.DB.prepare(SQL_REFRESH_LOG)
        .bind(status.time, ok, JSON.stringify(failed)).run();
    } catch {
      /* the log is an audit extra; the KV status stays canonical */
    }
  }
  return status;
}

// -------------------------------------------------------------- HTTP layer
function send(body, { status = 200, ctype = "text/plain; charset=utf-8" } = {}) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": ctype,
      // Browser-based converter frontends call this backend cross-origin.
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function proxyToConverter(env, pathAndQuery, ua) {
  const base = (env.EXTERNAL_SUBCONVERTER_URL || "").replace(/\/+$/, "");
  if (!base) {
    return send(
      "Unknown target format. clash, singbox, v2ray, surge, loon " +
      "and quanx are rendered natively by this converter; any other " +
      "target needs the EXTERNAL_SUBCONVERTER_URL variable set to " +
      "an external subconverter base URL.", { status: 501 });
  }
  try {
    const resp = await fetch(base + pathAndQuery, {
      headers: { "User-Agent": ua },
    });
    const body = await resp.arrayBuffer();
    return send(body, {
      status: resp.status,
      ctype: resp.headers.get("Content-Type") || "text/plain",
    });
  } catch (e) {
    return send(`backend proxy failed: ${errMsg(e)}`, { status: 502 });
  }
}

async function handleShorten(request, env) {
  let data = {};
  const text = await request.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      return send("bad request", { status: 400 });
    }
    if (!isObj(data)) return send("bad request", { status: 400 });
  }
  const S = (v) => (v ? String(v) : "");
  const target = S(data.target);
  const entry = S(data.entry);
  const exit_ = S(data.exit);
  const items = S(data.url);
  const want = S(data.code).trim();
  if (want && !validCode(want)) {
    return send("自定义后缀只能用字母、数字、-、_，长度 3 到 32",
      { status: 400 });
  }
  let record;
  if (entry || exit_) {
    if (!ALL_TARGETS.has(target) || !entry || !exit_) {
      return send("bad request", { status: 400 });
    }
    record = { kind: "chain", target, entry, exit: exit_ };
  } else if (items && target) {
    record = { kind: "conv", target, url: items };
  } else {
    return send("bad request", { status: 400 });
  }
  const code = await storeLink(env, record, want || null);
  if (code === null) {
    return send("这个后缀已被占用，换一个试试", { status: 409 });
  }
  const host = request.headers.get("Host") || new URL(request.url).host;
  const p = { clash: "m", singbox: "s" }[target];
  if (p) return send(`https://${host}/${p}/${code}`);
  return send(`https://${host}/c/${code}`);
}

async function handleFetch(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  const origin = url.origin;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Content-Length": "0",
      },
    });
  }

  if (request.method === "POST") {
    if (path === "/shorten") return handleShorten(request, env);
    if (path === "/admin/refresh") {
      const token = env.REFRESH_TOKEN;
      const authed = !!token &&
        request.headers.get("Authorization") === `Bearer ${token}`;
      // First-run bootstrap: while the mirror has never been
      // refreshed (no meta:rules_status), a tokenless call is
      // allowed so a fresh one-click deployment can fill the
      // mirror without dashboard secret setup first. The refresh
      // only downloads the bundled manifest's official URLs, and
      // the window closes permanently after the first success.
      if (!authed && (await env.KV.get("meta:rules_status"))) {
        return send("unauthorized", { status: 401 });
      }
      const status = await refreshRules(env);
      return send(JSON.stringify(status),
        { ctype: "application/json; charset=utf-8" });
    }
    return send("not found", { status: 404 });
  }
  if (request.method !== "GET") return send("not found", { status: 404 });

  if (path === "/" || path === "/index.html") {
    return send(PAGE, { ctype: "text/html; charset=utf-8" });
  }
  if (path.startsWith("/rules/")) {
    let rel = path.slice("/rules/".length);
    try {
      rel = decodeURIComponent(rel);
    } catch {
      /* keep raw */
    }
    if (!DST_SET.has(rel)) return send("not found", { status: 404 });
    const data = await getRule(env, rel);
    if (!data) return send("not found", { status: 404 });
    const ctype = rel.endsWith(".svg")
      ? "image/svg+xml" : "application/octet-stream";
    return send(data, { ctype });
  }

  // Saved-config restore: hand the stored record back as JSON so the
  // page can refill its form from a short code (the code is the
  // bearer credential for the record, same trust model as the link
  // itself).
  if (path.startsWith("/api/link/")) {
    const raw = path.slice("/api/link/".length);
    let code = raw;
    try {
      code = decodeURIComponent(raw);
    } catch {
      /* keep raw */
    }
    code = code.replace(/^\/+|\/+$/g, "");
    const rec = code ? await getLink(env, code) : null;
    if (!rec) return send("link not found", { status: 404 });
    return send(JSON.stringify(rec),
      { ctype: "application/json; charset=utf-8" });
  }

  const fmt = { c: null, m: "clash", s: "singbox" };
  const sm = path.match(/^\/([cms])\/(.+)$/);
  if (sm && path.length > 3) {
    const code = sm[2].replace(/^\/+|\/+$/g, "");
    const rec = code ? await getLink(env, code) : null;
    if (!rec) return send("link not found", { status: 404 });
    // Count the fetch (D1 tier only; fire-and-forget via waitUntil).
    if (ctx && ctx.waitUntil) ctx.waitUntil(bumpLinkHit(env, code));
    // The path letter picks the output format (m = Mihomo / clash,
    // s = sing-box); /c/ falls back to the format the link was
    // created with.
    const want = fmt[sm[1]] || rec.target || "";
    if (rec.kind === "chain") {
      STAGE.cur = "start";
      try {
        const [body, ctype] = await buildChainFor(
          want, rec.entry, rec.exit, origin);
        return send(body, { ctype });
      } catch (e) {
        return send(`chain generate failed at ${STAGE.cur}: ${errMsg(e)}`,
          { status: 502 });
      }
    }
    const target = want;
    const items = rec.url || "";
    if (ALL_TARGETS.has(target) && items) {
      try {
        const [body, ctype] = await buildConfig(target, items, origin);
        return send(body, { ctype });
      } catch (e) {
        return send(`convert failed: ${errMsg(e)}`, { status: 502 });
      }
    }
    const q = new URLSearchParams({ target, url: items }).toString();
    return proxyToConverter(env, "/sub?" + q, BROWSER_UA);
  }

  if (path === "/version") {
    return send("subscription-converter cf-worker");
  }
  if (path === "/sub") {
    const target = url.searchParams.get("target") || "";
    const items = url.searchParams.get("url") || "";
    if (ALL_TARGETS.has(target) && items) {
      try {
        const [body, ctype] = await buildConfig(target, items, origin);
        return send(body, { ctype });
      } catch (e) {
        return send(`convert failed: ${errMsg(e)}`, { status: 502 });
      }
    }
    return proxyToConverter(env, path + url.search,
      request.headers.get("User-Agent") || BROWSER_UA);
  }
  if (path === "/conv") {
    const target = url.searchParams.get("target") || "";
    const items = url.searchParams.get("url") || "";
    if (!ALL_TARGETS.has(target) || !items) {
      return send("bad request", { status: 400 });
    }
    try {
      const [body, ctype] = await buildConfig(target, items, origin);
      return send(body, { ctype });
    } catch (e) {
      return send(`convert failed: ${errMsg(e)}`, { status: 502 });
    }
  }
  if (path === "/chain") {
    const target = url.searchParams.get("target") || "";
    const entry = url.searchParams.get("entry") || "";
    const exit_ = url.searchParams.get("exit") || "";
    if (!ALL_TARGETS.has(target) || !entry || !exit_) {
      return send(
        "bad request: need target=clash|singbox|v2ray|surge|loon|quanx, entry, exit",
        { status: 400 });
    }
    STAGE.cur = "start";
    try {
      const [body, ctype] = await buildChainFor(target, entry, exit_,
        origin);
      return send(body, { ctype });
    } catch (e) {
      return send(`chain generate failed at ${STAGE.cur}: ${errMsg(e)}`,
        { status: 502 });
    }
  }
  return send("not found", { status: 404 });
}

export default {
  fetch: (request, env, ctx) => handleFetch(request, env, ctx),
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshRules(env));
  },
};
