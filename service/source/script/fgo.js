/*
 * fgo.js
 * name:RT
 * email:623059008@qq.com
 * qq:623059008
 * time:2017.10.27
*/
/*
	这是一个用来解决所有setTimeout执行顺序的中央时间管理
	将所有需要由setTimeout执行的动画更改放到一条时间线上,异步执行,但是自动分配延后时间，从而让动画持续显示
	在JavaScript Ninja一书中找到，稍加更改,十分好用
	甚至可以用setTimeout代替setInterval.
*/
var timers={
	timerId:-1,
	timers:[],
	wait:[],
	commit:[],
	debug:false,
	add:function(fn,time,msg){
		this.timers.push(fn);
		this.wait.push(time);
		this.commit.push(msg||"");
	},
	start:function(){
		//Run all missions as setting wait time.
		(function runNext(){
			if(timers.timers.length>0)
			{
				var timeline=0;
				for (var i = 0; i < timers.timers.length; i++) {
					timeline+=timers.wait[i];
					timers.timerId = setTimeout(timers.timers[i],timeline);
					if(timers.debug)
					{
						(function(msg){
							setTimeout(function(){
								console.log(msg);
							},timeline);
						})(timers.commit[i]);
					}
				}
			}
		})();
	},
	clear:function(){
		this.timers=[];
		this.wait=[];
		this.commit=[];
	},
};
var item=[];//图鉴物品
var Myitem=[];//我的物品中的所有信息（强化材料和从者）
var GG=[];//公告信息
var Myservent_qh=[];//可强化从者列表
var Myitem_qh=[];//可选择强化材料列表
var Myservent_dg=[];//可选择打工从者列表
var Working_servent=[];//正在打工从者列表
var Working_servent_time=[];//正在打工从者的时间数据,用于实时更新
var Working_servent_time_idlist=[];//已经完成打工从者的时间数据,用于更新现在的打工从者
var Myitem_jy=[];//交易的所有数据
var Sellitem=[];//玩家可以选择售卖的从者
var Solditem=[];//玩家已经售卖的从者
var UserMsg=[];//玩家的信息,显示在上方的信息容器中
var emoji=['(๑•̀ㅂ•́)و✧','ヾ(≧▽≦*)o','o(*≧▽≦)ツ','ヾ(≧∇≦*)ゝ','╰(￣▽￣)╭','(>▽<)','(￣┰￣*)','（○｀ 3′○）','o(￣ε￣*)','（*＾-＾*）','=￣ω￣=','ヾ(´･ω･｀)ﾉ','(～o￣3￣)～','(。・・)ノ','( ╯▽╰)','o(〃\'▽\'〃)o','w(ﾟДﾟ)w','(。_。)','⊙▽⊙','⊙▽⊙','(；′⌒`)','(σ｀д′)σ','◐▽◑','(/▽＼)','つ﹏⊂','(′▽`〃)','(个_个)','(っ´Ι`)っ','(ToT)/~~~','（ ゜ρ゜)ノ','(ง •_•)ง','ฅʕ•̫͡•ʔฅ','ฅ^ω^ฅ','⊙̆̈_⊙̆̈','(:３っ)∋','⊂(`ω´∩)','ﾍ( ´Д`)ﾉ'];
var My_SPHINX=0;//玩家的钱
var Get_Servent_Time=null;//定时获取从者的打工时间
//后台传入数据
var HOST="127.0.0.1:5000/";
	$(function() {
		var fgo={
			init:function(){
				//检查登录
				this.login();
				//Notify容器声明
				Notify.container=$("#fgo_msg");
				if($.cookie("fgo-user"))
				{
					//声明消息容器，请求未读消息数据
					this.notification();
					//请求后台图鉴数据
					this.get_tj_data();
					//请求后台物品数据
					this.get_wp_data();
					//请求后台公告数据
					this.get_gg_data();
					//控制function_butotn的显示状态
					this.btn_page_control();
					//召唤按钮的事件
					this.zh();
					//部署切换页面的按钮点击事件
					this.open_page();
					//切换召唤卡池背景
					this.zh_background();
					//控制声音开启或关闭
					this.close_voice();
					//铺展图鉴数据
					this.tj();
					//强化页面的所有功能
					this.qh();
					//打工所有页面的功能
					this.dg();
					//交易页面的所有功能
					this.jy();
					//通知系统
					this.notification();
					//彩 蛋 :>
					this.colorful_egg();
					//插件
					//鼠标带星星特效
					this.starmouse();
				}
			},
			post_dg:function(serventid){
				/* 发送打工请求 */
				$.ajax({
							cache: false,
							async: true,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/dg.php',
							type: "POST",
							time:300000,//5分钟
							traditional: true,
							data: {'inf': 'dg','user':$.cookie('fgo-user'),'servent_id':JSON.stringify(serventid)},
							error: function(e){
									 console.dir(e);
									 //网路出错,ajax失败，不要忘了重新开放打工按钮
									 $("#dg_post").attr("disabled",false);
							},
							success:function(data)
							{
								Working_servent=[];
								if(data.length>0)
								{
									if(data=="false" || data==false)
									{
										//网络连接等因素失败
										$("#dg_post").attr("disabled",true);
										$("#dg_post").text("派遣失败");
										let options={
											status:'danger',
											text:'派遣失败,请重试',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
										setTimeout(function(){
											$("#dg_post").text("请重试");
											setTimeout(function(){
												$("#dg_post").text("打工派遣");
												$("#dg_post").attr("disabled",false);
											},1000);
										},1000);
									}else{
										//派遣成功
										$("#dg_post").attr("disabled",false);
										let options={
											status:'success',
											text:'您派遣了您の从者去打工',
											click:msg_click_empty,
											type:2
										}
										let msg=new Notify(options);
									}
							  }else{
									//网络连接等因素失败
									$("#dg_post").attr("disabled",true);
									$("#dg_post").text("派遣失败");
									let options={
										status:'danger',
										text:'派遣失败,请重试',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									setTimeout(function(){
										$("#dg_post").text("请重试");
										setTimeout(function(){
											$("#dg_post").text("打工派遣");
											$("#dg_post").attr("disabled",false);
										},1000);
									},1000);
								}
							}
					 });
			},
			post_buy:function(jyid){
				/* 发送购买从者请求 */
				$.ajax({
							cache: false,
							async: true,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/jy.php',
							type: "POST",
							time:100,
							traditional: true,
							data: {'inf': 'buy','user':$.cookie('fgo-user'),'jyid':jyid},
							error: function(e){
									 console.dir(e);
									 //网路出错,ajax失败
							},
							success:function(data)
							{
									if(data=="false" || data==false)
									{
										//网络连接等因素失败
										let options={
											status:'danger',
											text:'您の从者购买失败，请重试.',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
									}else{
									  let options={
											status:'success',
											text:'您の从者购买成功,该从者已与您缔结契约.',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
										//成功并刷新交易数据
										fgoThis.get_jy_data();
									}
							}
					 });
			},
			sell_servent:function(id,price){
				/* 发送添加售卖从者请求 */
				$.ajax({
							cache: false,
							async: true,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/jy.php',
							type: "POST",
							time:100,
							traditional: true,
							data: {'inf': 'add','user':$.cookie('fgo-user'),'itemid':id,'price':price},
							error: function(e){
									 console.dir(e);
									 //网路出错,ajax失败，不要忘了重新开放发布按钮
									 $("#jy_sell_servent_btn").attr("disabled",false);
							},
							success:function(data)
							{
									if(data=="false" || data==false)
									{
										//网络连接等因素失败
										$("#jy_sell_servent_btn").attr("disabled",false);
										let options={
											status:'danger',
											text:'您的售卖从者の请求发布失败,请重试.',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
									}else{
										//成功并刷新交易数据
										let options={
											status:'success',
											text:'您的售卖从者の请求发布成功!',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
										fgoThis.get_jy_data();
										$("#jy_model").hide();
										$("#jy_shadow").hide();
									}
							}
					 });
			},
			get_user_msg:function(){
				fgoThis=this;
				/*获得用户消息数据*/
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/msg.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'get','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function(data)
							{
								if(data=="用户登录异常" || data=="服务器繁忙")
								{
									let options={
										status:'warning',
										text:'用户登录异常 or 服务器繁忙.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
								}else{
									UserMsg=[];
									var s=JSON.parse(data);
									for (var i = 0; i < s.length; i++) {
										var _i={};
										var id="id"+i;
										_i["id"]=s[id];
										var text="text"+i;
										_i["text"]=s[id];
										var status="status"+i;
										_i["status"]=s[id];
										UserMsg.push(_i);
									}
									//将所有未读消息添加进消息池中等待显示和关闭
										fgoThis.runNotifyMsg();
										//自动生成js数据填写
										// var str="[";
										// for (var i = 0; i < UserMsg.length; i++) {
										// 	str+="{";
										// 	for (var j in UserMsg[i]) {
										// 		str+=j+":"+"\'"+UserMsg[i][j]+"\',";
										// 	}
										// 	str+="},"
										// }
										// str+="]";
										// console.log(str);
								}
							 }
					 });
			},
			zh_ten_ajax:function(new_j){
				var fgoThis=this;
				var ItemResult=[];
				/*获得10连数据*/
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/zh.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'zh10','data':JSON.stringify(new_j),'times':10,'user':$.cookie("fgo-user")},
							error: function(e){
									 console.dir(e);
							},
							success:function(data)
							{
								if(data=="用户登录异常")
								{
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									return;
								}
								while(data[0]!="{")
								{
									data=data.substr(1,data.length);
								}
								var s=JSON.parse(data);
								var id="";
								for (var i = 0; i < s.length; i++) {
									var _i={};
									id="id"+i;
									_i["id"]=s[id];
									id="name"+i;
									_i["name"]=s[id];
									id="level"+i;
									_i["level"]=s[id];
									id="strength"+i;
									_i["strength"]=s[id];
									id="type"+i;
									_i["type"]=s[id];
									id="class"+i;
									_i["class"]=s[id];
									ItemResult.push(_i);
								}
								fgoThis.zh_10_result_show(ItemResult);
									//自动生成js数据填写
									// var str="[";
									// for (var i = 0; i < ItemResult.length; i++) {
									// 	str+="{";
									// 	for (var j in ItemResult[i]) {
									// 		str+=j+":"+"\'"+ItemResult[i][j]+"\',";
									// 	}
									// 	str+="},"
									// }
									// str+="]";
									// console.log(str);
							 }
					 });
			},
			get_buy_dg_block:function(){
				var fgoThis=this;
				//重新校准没有校准的时间.
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/dg.php',
							type: "POST",
							time:1000,//1s
							traditional: true,
							data: {'inf': 'buy_dg_block','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function(data)
							{
								console.log(data);
								console.log(data==1);
								console.log(data=='1');
								//设置dg_block_num
								$("#buy_dg_block_no").attr("disabled",false);
								if(data=="用户登录异常")
								{
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);

									$("#dg_block_text").html("<span style='color:#FF0000;'>用户登录异常</span>");
									setTimeout(function(){
										$("#buy_dg_block_no").trigger('click');
									},1000);
								}else if(data=="余额不足")
								{
									let options={
										status:'info',
										text:'余额不足.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									$("#dg_block_text").html("<span style='color:#FF0000;'>您的SPHINX$不足</span>");
									setTimeout(function(){
											$("#buy_dg_block_no").trigger('click');
									},1000);

									fgoThis.get_dg_num();
								}else if(data=="true" || data==true || data==1 || data=='1')
								{
									let options={
										status:'success',
										text:'您の打工位变多了，又一位从者可以出去挣钱了.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									$("#dg_cont").attr("max-block",parseInt($("#dg_cont").attr("max-block"),10)+1);
									for (var i = 1; i <=parseInt($("#dg_cont").attr("max-block"),10); i++){
										var id="#dg_servent"+i;
										$(id).find(".dg_block_disable").remove();
									}
									$("#dg_block_text").html("<span style='color:#FF3333;'>购买成功!</span>");
									setTimeout(function(){
										$("#buy_dg_block_no").trigger('click');
									},1000);
								}else{
									let options={
										status:'danger',
										text:'服务器繁忙,购买失败,请稍后再试.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									$("#dg_block_text").html("<span style='color:#FF0000;'>服务器繁忙,购买失败,请稍后再试</span>");
									setTimeout(function(){
										$("#buy_dg_block_no").trigger('click');
									},1000);
								}

							}
					 });
			},
			get_dg_block_num:function(){
				var fgoThis=this;
				//重新校准没有校准的时间.
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/dg.php',
							type: "POST",
							time:1000,//1s
							traditional: true,
							data: {'inf': 'get_dg_block','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function(data)
							{
								//设置dg_block_num
								if(data=="查询错误")
								{
									let options={
										status:'danger',
										text:'服务器繁忙,查询错误,请稍后再试.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									fgoThis.get_dg_block_num();
								}
								else if(data=="用户登录异常")
								{
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									$("#dg_cont").attr("max-block",2);
									return;
								}else{
										$("#dg_cont").attr("max-block",data);
										for (var i = 1; i <=parseInt(data,10); i++){
											var id="#dg_servent"+i;
											$(id).find(".dg_block_disable").remove();
										}
								}

							}
					 });
			},
			get_dg_time:function(){
				var fgoThis=this;
				//重新校准没有校准的时间.
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/dg.php',
							type: "POST",
							time:1000,//1s
							traditional: true,
							data: {'inf': 'get_dg_time','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function(data)
							{
								if(data=="用户登录异常"){
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									return;
								}
								//更新钱的数量的显示
								fgoThis.get_dg_num();
							}
					 });
			},
			get_dg_working_time:function(serventid){
				/*获得正在打工的从者打工时间*/
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/dg.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'time','user':$.cookie('fgo-user'),"servent_id":JSON.stringify(serventid)},
							error: function(e){
									 console.dir(e);
							},
							success:function(data)
							{
								Working_servent_time=[];
								if(data=="用户登录异常")
								{
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									return;
								}
								if(data.length>0 && data!="用户登录异常")
								{
									var s=JSON.parse(data);
									//console.log(s);
									var id="";
									for (var i = 0; i < s.length; i++) {
										var _i={};
										id="id"+i;
										_i["id"]=s[id];
										id="beginwork"+i;
										_i["beginwork"]=s[id];
										id="name"+i;
										_i["name"]=s[id];
										id="level"+i;
										_i["level"]=s[id];
										id="exp"+i;
										_i["exp"]=s[id];
										Working_servent_time.push(_i);
									}
										//渲染工作从者的数据
										fgoThis.dg_working_servent_refresh_sec();
										Get_Servent_Time=setInterval(function(){
											fgoThis.dg_working_servent_refresh_sec();
										},1000);
										//自动生成js数据填写
										// var str="[";
										// for (var i = 0; i < Working_servent_time.length; i++) {
										// 	str+="{";
										// 	for (var j in Working_servent_time[i]) {
										// 		str+=j+":"+"\'"+Working_servent_time[i][j]+"\',";
										// 	}
										// 	str+="},"
										// }
										// str+="]";
										// console.log(str);
									}
							 }
					 });
			},
			get_dg_working_servent:function(){
				/*获得正在打工的从者数据*/
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/dg.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'get_working_servent','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function(data)
							{
								Working_servent=[];
								if(data=="用户登录异常")
								{
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									return;
								}
								if(data.length>0 && data!="用户登录异常")
								{
									var s=JSON.parse(data);
									//console.log(s);
									var id="";
									for (var i = 0; i < s.length; i++) {
										var _i={};
										id="id"+i;
										_i["id"]=s[id];
										id="beginwork"+i;
										_i["beginwork"]=s[id];
										id="strength"+i;
										_i["strength"]=s[id];
										id="level"+i;
										_i["level"]=s[id];
										id="exp"+i;
										_i["exp"]=s[id];
										id="name"+i;
										_i["name"]=s[id];
										id="myitemid"+i;
										_i["myitemid"]=s[id];
										Working_servent.push(_i);
									}
										//更新从者打工时间或者弹出打工完成的提示
										fgoThis.dg_working_servent_append();
										//自动生成js数据填写
										// var str="[";
										// for (var i = 0; i < Working_servent.length; i++) {
										// 	str+="{";
										// 	for (var j in Working_servent[i]) {
										// 		str+=j+":"+"\'"+Working_servent[i][j]+"\',";
										// 	}
										// 	str+="},"
										// }
										// str+="]";
										// console.log(str);
									}
							 }
					 });
			},
			get_dg_servent:function(){
				fgoThis=this;
				var check=[];
				for(var j in Myservent_dg)
				{
					if(Myservent_dg[j]["check"]=="yes")
					check.push(Myservent_dg[j]["id"]);
				}
				check.findchecked=function(ind)
				{
					for (var i = 0; i < check.length; i++) {
						if(check[i]==ind)
						{
							return true;
						}
					}
					return false;
				}
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/dg.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'get_servent','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function (data)
							{
								if(data=="用户登录异常")
								{
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									return;
								}
								//每次get物品数据要先清空，不然就会重复
								Myservent_dg=[];
								//console.log(data);
								var s=JSON.parse(data);
								var id="";
								for (var i = 0; i < s.length; i++) {
									var _i={};
									id="id"+i;
									_i["id"]=s[id];
									_i["check"]="no";
									if(check.findchecked(s[id]))
									_i["check"]="yes";
									id="name"+i;
									_i["name"]=s[id];
									id="level"+i;
									_i["level"]=s[id];
									id="strength"+i;
									_i["strength"]=s[id];
									id="class"+i;
									_i["class"]=s[id];
									id="work"+i;
									_i["work"]=s[id];
									id="exp"+i;
									_i["exp"]=s[id];
									id="allexp"+i;
									_i["allexp"]=s[id];
									id="date"+i;
									_i["date"]=s[id];
									id="itemid"+i;
									_i["itemid"]=s[id];
									Myservent_dg.push(_i);
								}
								//铺展MyServent数据,同步获取
								fgoThis.dg_append_servent_data();
								// 自动生成js数据填写
								// var str="[";
								// for (var i = 0; i < Myservent_qh.length; i++) {
								// 	str+="{";
								// 	for (var j in Myservent_qh[i]) {
								// 		str+=j+":"+"\'"+Myservent_qh[i][j]+"\',";
								// 	}
								// 	str+="},"
								// }
								// str+="]";
								// console.log(str);
						 }
					 });
			},
			get_dg_num:function(){
				fgoThis=this;
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/dg.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'get',"user":$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function (data)
							{
								//var s=JSON.parse(data);
								if(data==false)
								{
										console.log("SPHINX数量查询异常或数目为0");
										$("#my_sp").text("0");
								}else{
									if(data=="用户登录异常")
									{
										let options={
											status:'warning',
											text:'用户登录异常,请刷新页面重新登录.',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
										$("#my_sp").text('0');
										return;
									}else{
										My_SPHINX=parseInt(data);
										var dataformat={};
										dataformat["data"]=String(data);
										dataformat["len"]=dataformat["data"].length;
										if(parseInt(dataformat["len"]/5)==1)
										{
											dataformat["data"]=String((parseInt(data,10)/10000).toFixed(2))+"万";
										}
										if(parseInt(dataformat["len"]/5)==2)
										{
											dataformat["data"]=String((parseInt(data,10)/100000000).toFixed(2))+"亿";
										}
										$("#my_sp").text(dataformat["data"]);
									}
								}
								}
					 });
			},
			get_qh_item:function(){
				fgoThis=this;
				//存储上一次选择的item以防止被刷掉
				var check=[];
				for(var j in Myitem_qh)
				{
					if(Myitem_qh[j]["check"]=="yes")
					check.push(Myitem_qh[j]["id"]);
				}
				check.findchecked=function(ind)
				{
					for (var i = 0; i < check.length; i++) {
						if(check[i]==ind)
						{
							return true;
						}
					}
					return false;
				}
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/qh.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'get_item','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function (data)
							{
								if(data=="用户登录异常")
								{
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									return;
								}
								//每次get物品数据要先清空，不然就会重复
								Myitem_qh=[];
								//console.log(data);
								var s=JSON.parse(data);
								var id="";
								for (var i = 0; i < s.length; i++) {
									var _i={};
									id="id"+i;
									_i["id"]=s[id];
									_i["check"]="no";
									if(check.findchecked(s[id]))
									_i["check"]="yes";
									id="name"+i;
									_i["name"]=s[id];
									id="level"+i;
									_i["level"]=s[id];
									id="strength"+i;
									_i["strength"]=s[id];
									id="class"+i;
									_i["class"]=s[id];
									id="work"+i;
									_i["work"]=s[id];
									id="exp"+i;
									_i["exp"]=s[id];
									id="date"+i;
									_i["date"]=s[id];
									id="itemid"+i;
									_i["itemid"]=s[id];
									id="type"+i;
									_i["type"]=s[id];
									Myitem_qh.push(_i);
								}
								//同步渲染数据
								fgoThis.qh_append_item_data();
								// 自动生成js数据填写
								// var str="[";
								// for (var i = 0; i < Myitem_qh.length; i++) {
								// 	str+="{";
								// 	for (var j in Myitem_qh[i]) {
								// 		str+=j+":"+"\'"+Myitem_qh[i][j]+"\',";
								// 	}
								// 	str+="},"
								// }
								// str+="]";
								// console.log(str);

						 }
					 });
			},
			get_qh_servent:function(){
				fgoThis=this;
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/qh.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'get_servent','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function (data)
							{
								if(data=="用户登录异常")
								{
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									return;
								}
								//每次get物品数据要先清空，不然就会重复
								Myservent_qh=[];
								//console.log(data);
								var s=JSON.parse(data);
								var id="";
								for (var i = 0; i < s.length; i++) {
									var _i={};
									id="id"+i;
									_i["id"]=s[id];
									id="name"+i;
									_i["name"]=s[id];
									id="level"+i;
									_i["level"]=s[id];
									id="strength"+i;
									_i["strength"]=s[id];
									id="class"+i;
									_i["class"]=s[id];
									id="work"+i;
									_i["work"]=s[id];
									id="exp"+i;
									_i["exp"]=s[id];
									id="allexp"+i;
									_i["allexp"]=s[id];
									id="date"+i;
									_i["date"]=s[id];
									id="itemid"+i;
									_i["itemid"]=s[id];
									Myservent_qh.push(_i);
								}
								//铺展MyServent数据,同步获取
								fgoThis.qh_append_servent_data();
								// 自动生成js数据填写
								// var str="[";
								// for (var i = 0; i < Myservent_qh.length; i++) {
								// 	str+="{";
								// 	for (var j in Myservent_qh[i]) {
								// 		str+=j+":"+"\'"+Myservent_qh[i][j]+"\',";
								// 	}
								// 	str+="},"
								// }
								// str+="]";
								// console.log(str);
						 }
					 });
			},
			get_gg_data:function(){
				fgoThis=this;
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/gg.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'get',"user":$.cookie("fgo-user")},
							error: function(e){
									 console.dir(e);
							},
							success:function (data)
							{
								if(data=="用户登录异常")
								{
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									return;
								}
								GG=[];
								//console.log(data);
								var begin_json=0;
								while(data[begin_json]!="{")
								{
									begin_json++;
								}
								var s=JSON.parse(data.substr(begin_json,data.length));
								var id="";
								for (var i = 0; i < s.length; i++) {
									var _i={};
									id="id"+i;
									_i["id"]=s[id];
									id="title"+i;
									_i["title"]=s[id];
									id="content"+i;
									_i["content"]=s[id];
									GG.push(_i);
								}
								//铺展公告数据，在这里铺展有助于异步
								fgoThis.gg();
								// 自动生成js数据填写
								// var str="[";
								// for (var i = 0; i < GG.length; i++) {
								// 	str+="{";
								// 	for (var j in GG[i]) {
								// 		str+=j+":"+"\'"+GG[i][j]+"\',";
								// 	}
								// 	str+="},"
								// }
								// str+="]";
								// console.log(str);
						 }
					 });
			},
			get_wp_data:function(){
				fgoThis=this;
				/*获得物品数据*/
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/myitem.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'get','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function (data)
							{
								if(data=="用户登录异常")
								{
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									return;
								}
								//每次get物品数据要先清空，不然就会重复
								Myitem=[];
								//console.log(data);
								var s=JSON.parse(data);
								var id="";
								for (var i = 0; i < s.length; i++) {
									var _i={};
									id="id"+i;
									_i["id"]=s[id];
									id="name"+i;
									_i["name"]=s[id];
									id="level"+i;
									_i["level"]=s[id];
									id="strength"+i;
									_i["strength"]=s[id];
									id="type"+i;
									_i["type"]=s[id];
									id="class"+i;
									_i["class"]=s[id];
									id="work"+i;
									_i["work"]=s[id];
									id="itemnum"+i;
									_i["itemnum"]=s[id];
									id="exp"+i;
									_i["exp"]=s[id];
									id="date"+i;
									_i["date"]=s[id];
									id="userid"+i;
									_i["userid"]=s[id];
									id="user"+i;
									_i["user"]=s[id];
									id="itemid"+i;
									_i["itemid"]=s[id];
									Myitem.push(_i);
								}
								//铺展物品数据，在这里铺展有助于异步
									fgoThis.wp();
									// 自动生成js数据填写
									// var str="[";
									// for (var i = 0; i < Myitem.length; i++) {
									// 	str+="{";
									// 	for (var j in Myitem[i]) {
									// 		str+=j+":"+"\'"+Myitem[i][j]+"\',";
									// 	}
									// 	str+="},"
									// }
									// str+="]";
									// console.log(str);
						 }
					 });
			},
			get_tj_data:function(){
						/*获得图鉴数据*/
						$.ajax({
									cache: false,
									async: false,
									contentType: "application/x-www-form-urlencoded; charset=utf-8",
									url: 'source/php/tj.php',
									type: "POST",
									traditional: true,
									data: {'inf': 'get'},
									error: function(e){
											 console.dir(e);
									},
									success:function(data)
									{
										if(data=="用户登录异常")
										{
											let options={
												status:'warning',
												text:'用户登录异常,请刷新页面重新登录.',
												click:msg_click_empty,
												type:1
											}
											let msg=new Notify(options);
											return;
										}
										var s=JSON.parse(data);
										var id="";
								 		for (var i = 0; i < s.length; i++) {
											var _i={};
											id="id"+i;
											_i["id"]=s[id];
											id="name"+i;
											_i["name"]=s[id];
											id="level"+i;
											_i["level"]=s[id];
											id="strength"+i;
											_i["strength"]=s[id];
											id="type"+i;
											_i["type"]=s[id];
											id="class"+i;
											_i["class"]=s[id];
											item.push(_i);
								 		}
											//自动生成js数据填写
											// var str="[";
											// for (var i = 0; i < item.length; i++) {
											// 	str+="{";
											// 	for (var j in item[i]) {
											// 		str+=j+":"+"\'"+item[i][j]+"\',";
											// 	}
											// 	str+="},"
											// }
											// str+="]";
											// console.log(str);
									 }
							 });
			},
			get_jy_data:function(){
				fgoThis=this;
				/*获得交易数据*/
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/jy.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'get','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function(data)
							{
								if(data=="用户登录异常" || data=="服务器繁忙")
								{
									if(data=="用户登录异常")
									{
										let options={
											status:'warning',
											text:'用户登录异常,请刷新页面重新登录.',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
										return;
									}else{
										let options={
											status:'danger',
											text:'服务器繁忙,请稍后重试.',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
									}
								}else{
									Myitem_jy=[];
									var s=JSON.parse(data);
									var id="";
									for (var i = 0; i < s.length; i++) {
										var _i={};
										id="id"+i;
										_i["id"]=s[id];
										id="userid"+i;
										_i["userid"]=s[id];
										id="myitemid"+i;
										_i["myitemid"]=s[id];
										id="price"+i;
										_i["price"]=s[id];
										id="name"+i;
										_i["name"]=s[id];
										id="level"+i;
										_i["level"]=s[id];
										id="strength"+i;
										_i["strength"]=s[id];
										id="exp"+i;
										_i["exp"]=s[id];
										id="class"+i;
										_i["class"]=s[id];
										id="allexp"+i;
										_i["allexp"]=s[id];
										id="date"+i;
										_i["date"]=s[id];
										id="itemid"+i;
										_i["itemid"]=s[id];
										id="user"+i;
										_i["user"]=s[id];
										_i["type"]='servent';
										Myitem_jy.push(_i);
									}
									//渲染交易数据
									fgoThis.jy_append_item_data();
										//自动生成js数据填写
										// var str="[";
										// for (var i = 0; i < Myitem_jy.length; i++) {
										// 	str+="{";
										// 	for (var j in Myitem_jy[i]) {
										// 		str+=j+":"+"\'"+Myitem_jy[i][j]+"\',";
										// 	}
										// 	str+="},"
										// }
										// str+="]";
										// console.log(str);
								}
							 }
					 });
			},
			cancel_sold_servent:function(id){
				fgoThis=this;
				/* 发送删除售卖从者请求 */
				$.ajax({
							cache: false,
							async: true,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/jy.php',
							type: "POST",
							time:100,
							traditional: true,
							data: {'inf': 'del','user':$.cookie('fgo-user'),'itemid':id,},
							error: function(e){
									 console.dir(e);
									 //网路出错,ajax失败，不要忘了重新开放撤销按钮
									 $("#jy_sold_servent_btn").attr("disabled",false);
							},
							success:function(data)
							{
									if(data=="false" || data==false)
									{
										let options={
											status:'warning',
											text:'服务器繁忙,撤销失败,请稍后重试.',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
										//网络连接等因素失败
										$("#jy_sold_servent_btn").attr("disabled",false);
									}else{
										let options={
											status:'info',
											text:'您の从者已经回到家里暖床了!',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
										//成功并刷新交易数据
										fgoThis.get_jy_data();
										$("#jy_model").hide();
										$("#jy_shadow").hide();
									}
							}
					 });
			},
			get_sold_servent:function(){
				fgoThis=this;
				/*获得交易数据*/
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/jy.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'get_sold_servent','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function(data)
							{
								if(data=="用户登录异常" || data=="服务器繁忙")
								{
									if(data=="用户登录异常")
									{
										let options={
											status:'warning',
											text:'用户登录异常,请刷新页面重新登录.',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
										return;
									}else{
										let options={
											status:'danger',
											text:'服务器繁忙,请稍后重试.',
											click:msg_click_empty,
											type:1
										}
										let msg=new Notify(options);
									}
								}else{
									Solditem=[];
									var s=JSON.parse(data);
									var id="";
									for (var i = 0; i < s.length; i++) {
										var _i={};
										id="id"+i;
										_i["id"]=s[id];
										id="userid"+i;
										_i["userid"]=s[id];
										id="myitemid"+i;
										_i["myitemid"]=s[id];
										id="price"+i;
										_i["price"]=s[id];
										id="name"+i;
										_i["name"]=s[id];
										id="level"+i;
										_i["level"]=s[id];
										id="strength"+i;
										_i["strength"]=s[id];
										id="exp"+i;
										_i["exp"]=s[id];
										id="class"+i;
										_i["class"]=s[id];
										id="allexp"+i;
										_i["allexp"]=s[id];
										id="date"+i;
										_i["date"]=s[id];
										id="itemid"+i;
										_i["itemid"]=s[id];
										id="user"+i;
										_i["user"]=s[id];
										_i["type"]='servent';
										Solditem.push(_i);
									}
									//渲染交易数据
									fgoThis.jy_servent_options2();
										//自动生成js数据填写
										// var str="[";
										// for (var i = 0; i < Solditem.length; i++) {
										// 	str+="{";
										// 	for (var j in Solditem[i]) {
										// 		str+=j+":"+"\'"+Solditem[i][j]+"\',";
										// 	}
										// 	str+="},"
										// }
										// str+="]";
										// console.log(str);
								}
							 }
					 });
			},
			get_sell_servent:function(){
				fgoThis=this;
				/*获得物品数据*/
				$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/jy.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'get_sell_servent','user':$.cookie('fgo-user')},
							error: function(e){
									 console.dir(e);
							},
							success:function (data)
							{
								//每次get物品数据要先清空，不然就会重复
								Sellitem=[];
								//console.log(data);
								if(data=="用户登录异常")
								{
									let options={
										status:'warning',
										text:'用户登录异常,请刷新页面重新登录.',
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
									return;
								}else
								{
									var s=JSON.parse(data);
									var id="";
									for (var i = 0; i < s.length; i++) {
										var _i={};
										id="id"+i;
										_i["id"]=s[id];
										id="name"+i;
										_i["name"]=s[id];
										id="level"+i;
										_i["level"]=s[id];
										id="strength"+i;
										_i["strength"]=s[id];
										id="type"+i;
										_i["type"]=s[id];
										id="class"+i;
										_i["class"]=s[id];
										id="work"+i;
										_i["work"]=s[id];
										id="itemnum"+i;
										_i["itemnum"]=s[id];
										id="exp"+i;
										_i["exp"]=s[id];
										id="date"+i;
										_i["date"]=s[id];
										id="userid"+i;
										_i["userid"]=s[id];
										id="user"+i;
										_i["user"]=s[id];
										id="itemid"+i;
										_i["itemid"]=s[id];
										Sellitem.push(_i);
									}
									//铺展从者数据，在这里铺展有助于异步
										fgoThis.jy_servent_options();
								}
									// 自动生成js数据填写
									// var str="[";
									// for (var i = 0; i < Sellitem.length; i++) {
									// 	str+="{";
									// 	for (var j in Sellitem[i]) {
									// 		str+=j+":"+"\'"+Sellitem[i][j]+"\',";
									// 	}
									// 	str+="},"
									// }
									// str+="]";
									// console.log(str);
						 }
					 });
			},
			login:function(){
				var fgoThis=this;
				//绑定enter登录键
				$("#in_pwd").focus(function(event) {
					document.onkeydown = function(e){
    			var ev = document.all ? window.event : e;
	    			if(ev.keyCode==13) {
	           		$("#login_button").trigger('click');
	     				}
						}
				});
				//打开login_shadow,未登录不允许任何操作
				$("#login_shadow").show();
				if(!$.cookie("fgo-user")){
					fgoThis.control_bgm("login_bgm",1);
					//登录注册面板
					$("#login").show();
					if($("#signup").val()=='')
					{
						$("#signup").val('1');
					}
					$("#signup").click(function(event) {
						if($(this).val()=='1')
						{
						$(this).val('2');
						$("#signin_panel").hide();
						$("#signup_panel").show();
						$("#login_title").text("用户注册");
						$("#signup").text("登录");
						}
						else if($(this).val()=='2')
						{
						$(this).val('1');
						$("#signup_panel").hide();
						$("#signin_panel").show();
						$("#login_title").text("用户登录");
						$("#signup").text("注册");
						}
					});
					//注册功能
					$("#signup_button").click(function(event) {
						var user=$("#up_username").val();
						var pwd=$("#up_pwd").val();
						var repwd=$("#up_repwd").val();
						if(pwd=='' || user=='')
						{
							$("#signup_info_text").html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;	用户名或密码不能为空!");
							$("#signup_info_text").css("color","red");
							setTimeout(function(){
								$("#signup_info_text").text("");
							},3000);
						}
						else if(pwd!=repwd)
						{
							// console.log(pwd);
							// console.log(repwd);
							$("#signup_info_text").html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;	两次密码不一样!");
							$("#signup_info_text").css("color","red");
							setTimeout(function(){
								$("#signup_info_text").text("");
							},3000);
						}
						else{
							$.ajax({
							 url: 'source/php/login.php',
							 type: 'POST',
							 dataType: 'json',
							 data: {'inf': 'add','user':user,'pwd':pwd,},
							 success:function(data){
								 if(data==true)
								 {
									 //登录成功
									 $.cookie("fgo-user",user);
									 $.cookie("fgo-pwd",pwd);
									 $("#signup_info_text").html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 注册成功!");
									 $("#signup_info_text").css("color","green");
									 setTimeout(function(){
										 $("#signup_info_text").text("");
										 $("#signup").trigger('click');
										 $("#in_username").val(user);
										 $("#in_pwd").val(pwd);
									 },1000);
								 }
								 else{
									 $("#signup_info_text").html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+data);
									 $("#signup_info_text").css("color","red");
									 setTimeout(function(){
									 	$("#signup_info_text").text("");
									 },3000);
								 }
							 },
							 error:function(e){
								 $("#signup_info_text").html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+e.responseText);
								 $("#signup_info_text").css("color","red");
								 setTimeout(function(){
									 $("#signup_info_text").text("");
								 },3000);
							 },
						 });
						}
					});
					//登录功能
					$("#login_button").click(function(event) {
						//登录
						var user=$("#in_username").val();
						var pwd=$("#in_pwd").val();
						if(pwd=='' || user=='')
						{
							$("#login_info_text").html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;	用户名或密码不能为空!");
							$("#login_info_text").css("color","red");
							setTimeout(function(){
								$("#login_info_text").text("");
							},3000);
						}else{
							 $.ajax({
								url: 'source/php/login.php',
								type: 'POST',
								dataType: 'json',
								data: {'inf': 'login','user':user,'pwd':pwd,},
								success:function(data){
									if(data==false)
									{
										$("#login_info_text").html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 用户名或密码错误!");
										$("#login_info_text").css("color","red");
										setTimeout(function(){
											$("#login_info_text").text("");
										},3000);
									}
									else{
										//登录成功
										$.cookie("fgo-user",user);
										$.cookie("fgo-pwd",pwd);
										$("#login_info_text").html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 登录成功!");
										//显示用户的money数据
										fgoThis.get_dg_num();
										fgoThis.get_dg_working_servent();
										fgoThis.get_dg_block_num();
										$("#login_info_text").css("color","green");
										setTimeout(function(){
											$("#login_info_text").text("");
											$("#login").hide();
											//登录成功，关闭shadow
											$("#login_shadow").hide();
											fgoThis.control_bgm("login_bgm",0);
											fgoThis.init();
											let options={
												status:'info',
												text:"登录成功!欢迎您"+user+"!",
												click:msg_click_empty,
												type:1
											}
											let msg=new Notify(options);
										},1000);
									}
								},
								error:function(e){
									$("#login_info_text").html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;	网络异常!");
									$("#login_info_text").css("color","red");
									setTimeout(function(){
										$("#login_info_text").text("");
									},3000);
								},
							});
						}
					});
				}else{
					//默认登录，关闭shadow
					$("#login_shadow").hide();
				}

			},
			zh_background:function(){
				//随机切换召唤的卡池背景图
				var backgroundstr='rgba(0, 0, 0, 0) url(style/images/zh'+rn(1,2)+'.jpg) repeat scroll 0% 0% / auto padding-box border-box';
				$("#zh").each(function(index, el) {
					$(el).css("background",backgroundstr);
				});
			},
			btn_page_control:function(){
				$(".function_pannel").animate({'width':'200px'},100);
				$(".function_pannel").css("opacity","0.3");
				$("#close_function_panel").click(function(event) {
					$(".function_pannel").animate({'width':'200px'},100);
					$(".function_pannel").css("opacity","0.3");
					$(this).hide();
				});
				$(".function_pannel").mouseover(function(event) {
						if($(".function_pannel").css("opacity")=="0.3")
						{
							$(".function_pannel").animate({'width':'100%'},300);
							$(".function_pannel").css("opacity","1");
							$("#close_function_panel").show();
						}
				});
				$(".function_pannel").click(function(){
						//console.log($(".function_pannel").css("width"));
						// if($(".function_pannel").css("width")=="980px")
						// {
						// 	$(".function_pannel").animate({"width":"200px"},300);
						// }
							$(".function_pannel").animate({"width":"100%"},300);
							$("#close_function_panel").show();
				});
			},
			open_page:function(){
				fgoThis=this;
				//选择一开始显示的页面
				page_control('zh');
				/*------------------------------召唤---------------------------------*/
				//召唤页面左下角的召唤详情跳转
				$("#zh_info").click(function(event) {
					//跳转到公告召唤说明
					page_control("gg");
				});
				//召唤页面左上角的关闭跳转
				$("#zh_back_btn").click(function(event) {
					//跳转到公告页面
					page_control("gg");
				});

				//点击没钱的好的按钮跳转到打工页面
				$("#lack_money_cancle").click(function(event) {
					$("#zh_lack_money").hide();
					page_control("dg");
				});
				/*------------------------------图鉴---------------------------------*/
				$("#tj_back_btn").click(function(event) {
					page_control("zh");
				});
				/*------------------------------打工---------------------------------*/
				$("#dg_back_btn").click(function(event) {
					if($("#dg2").css("display")=="none")
						page_control("gg");
					else
					{
						$("#dg_cont").show();
						$("#dg2").hide();
						$("#dg_check").hide();
						$("#dg_bottom_btn").show();
						$("#dg_post").show();
					}
				});
				$("#dg_info").click(function(event) {
					page_control("gg");
				});
				/*------------------------------强化---------------------------------*/
				$("#qh_back_btn").click(function(event) {
					page_control("zh");
				});
				/*------------------------------公告---------------------------------*/
				$("#gg_back_btn").click(function(event) {
					page_control("zh");
				});
				/*------------------------------物品---------------------------------*/
				$("#wp_back_btn").click(function(event) {
					page_control("zh");
				});
				/*------------------------------交易---------------------------------*/
				$("#jy_back_btn").click(function(event) {
					page_control('gg');
				});
				/*---------------------------------下方的function_pannel按钮---------------------------*/
				//function_pannel的按钮跳转
				$("#zh_page").click(function(event) {
					var nowid="zh";
					page_control(nowid);
					fgoThis.zh_background();
				});
				$("#tj_page").click(function(event) {
					var nowid="tj";
					page_control(nowid);
				});
				$("#dg_page").click(function(event) {
					var nowid="dg";
					page_control(nowid);
				});
				$("#qh_page").click(function(event) {
					var nowid="qh";
					page_control(nowid);
				});
				$("#gg_page").click(function(event) {
					var nowid="gg";
					page_control(nowid);
				});
				$("#wp_page").click(function(event) {
					var nowid="wp";
					fgoThis.get_wp_data();
					fgoThis.wp();
					page_control(nowid);
				});
				$("#jy_page").click(function(event) {
					var nowid="jy";
					fgoThis.jy();
					page_control(nowid);
				});

				//顶部按键1-7绑定页面跳转,特殊字母绑定页面跳转
				document.onkeyup = function (event) {
						 var e = event || window.event;
						 var keyCode = e.keyCode || e.which;
						 //login页面开启时禁用快捷键
						 if($("#login").css("display")=="none" && $("#jy_model").css("display")=='none')
						 {
							 switch (keyCode) {
									 case 49:$("#zh_page").trigger('click');break;
									 case 50:page_control('tj');break;
									 case 51:page_control('dg');break;
									 case 52:page_control('qh');break;
									 case 53:page_control('gg');break;
									 case 54:$("#wp_page").trigger('click');break;
									 case 55:page_control('jy');break;
									 case 67:$("#zh_page").trigger('click');break;//call for zh.
									 case 73:$("#tj_page").trigger('click');break;//illustration for tj.
									 case 87:$("#dg_page").trigger('click');break;//work for dg.
									 case 83:$("#qh_page").trigger('click');break;//strength for qh.
									 case 78:$("#gg_page").trigger('click');break;//notice for gg.
									 case 77:$("#wp_page").trigger('click');break;//materials for wp.
									 case 84:$("#jy_page").trigger('click');break;//transaction for jy.
									 default:
											 break;
							 }
						 }
				 }
			},
			control_bgm:function(playbgm,action){
				//声音开启时才播放
				if($("#all_voice").val()==''){
					$("#all_voice").val('1');
				}
				if($("#all_voice").val()=='1')
				{
				var allbgm=document.getElementById("all_bgm");
				var eggbgm=document.getElementById("egg_bgm");

				if(arguments.length==2)
				{
					var bgm=document.getElementById(playbgm);
					//console.log(bgm)
					//console.log()
					if(action==0)
					{
						if(eggbgm.paused)
						{
							//停播playbgm ,继续播放allbgm
							allbgm.play();
							bgm.pause();
						}else{
							//停播playbgm ,继续播放allbgm
							eggbgm.play();
							bgm.pause();
						}
					}else{
						if(eggbgm.paused)
						{
							//停播allbgm,播放playbgm
							bgm.play();
							allbgm.pause();
						}else{
							//停播allbgm,播放playbgm
							bgm.play();
							eggbgm.pause();
						}
					}
				}else{
					//无参数初始化,播放allbgm
					allbgm.play();
				}
				}
			},
			close_voice:function(){
				$("#all_voice").val()==''?$("#all_voice").val('1'):true;
				$("#all_voice").click(function(event) {
					if($(this).val()=="1")
					{
						//关闭声音
						$("#voice_i").attr('class','glyphicon glyphicon-volume-off');
						$(this).val('0');
						var voice1 = document.getElementsByTagName("video");
						var voice2 = document.getElementsByTagName("audio");
						$(voice1).each(function(index,el){
								el.pause();
						});
						$(voice2).each(function(index,el){
								el.pause();
						});
					}
					else{
						//开启声音
						$("#voice_i").attr('class','glyphicon glyphicon-volume-up');
						$(this).val('1');
						var allbgm=document.getElementById("all_bgm");
						allbgm.play();
					}
				});
			},
			zh:function(){
				fgoThis=this;
				//召唤页面打开就会请求一次矿量计算
				this.get_dg_num();
				//点击召唤按钮发生的事情
				$("#zh1").click(function(event) {
					//召唤一次
					if(My_SPHINX>=3)
					{
						// //隐藏function panel
						// $(".function_pannel").hide(300);
						fgoThis.control_bgm("zh_bgm",1);
						zh_hide_btn();
						j=getPush();
						new_j=[];
						new_j.push(j[0]);
						console.dir(j[0]);
						animate_zh1(j[0]["url"]);
						//召唤请求
						$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/myitem.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'add','user':$.cookie('fgo-user'),'data':JSON.stringify(new_j),'times':1},
							error: function(e){
									 console.dir(e);
							},
							success:function (data)
							{
								zh_show_btn();
								$(".function_pannel").show(7000);
								if(data==true || data=="true")
								{
									console.log("抽卡成功");
									fgoThis.get_dg_num();
								}else{
									let options={
										status:'danger',
										text:"服务器繁忙,数据没有全部添加成功.",
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
								}
							},
						});
					}else{
						$("#zh_lack_money").fadeIn();
					}
				});
				$("#ck_cancle").click(function(event) {
					$('#zh_attention').hide();
				});
				$("#ck_ok").click(function(event) {
					$('#zh_attention').hide();

					//召唤10次
					if(My_SPHINX>=30)
					{
						// //隐藏function panel
						// $(".function_pannel").hide(300);
						fgoThis.control_bgm("zh_bgm",1);
						//console.log('10');
						zh_hide_btn();
						j=getPush();
						console.dir(j);
						animate_zh10(j);
						//召唤请求
						$.ajax({
							cache: false,
							async: false,
							contentType: "application/x-www-form-urlencoded; charset=utf-8",
							url: 'source/php/myitem.php',
							type: "POST",
							traditional: true,
							data: {'inf': 'add','user':$.cookie('fgo-user'),'data':JSON.stringify(j),'times':10},
							error: function(e){
									 console.dir(e);
							},
							success:function (data)
							{
								zh_show_btn();
								if(data==true || data=="true")
								{
									console.log("抽卡成功");
									fgoThis.get_dg_num();
								}else{
									let options={
										status:'danger',
										text:"服务器繁忙,数据没有全部添加成功.",
										click:msg_click_empty,
										type:1
									}
									let msg=new Notify(options);
								}
							},
						});
					}
					else{
						$("#zh_lack_money").fadeIn();
					}
				});
				$("#zh10").click(function(event) {
					$("#zh_attention").fadeIn(300);
				});

				//传入召唤得到的卡片id
				function animate_zh1(url)
				{
					$("#zh_card").css("background","url(style/images/card/"+url+")");
					//召唤动画
					$("#zh_animate1").fadeIn(1500);
					setTimeout(function(){
						$("#zh_animate2").fadeIn(1500);
						setTimeout(function(){
							$("#zh_animate3").fadeIn(1500);
							setTimeout(function(){
								$("#zh_animate4").fadeIn(1500);
								setTimeout(function(){
									$("#zh_card").fadeIn(2000);
									setTimeout(function(){
										$("#zh_card").fadeOut('fast');
										$("#zh_animate4").fadeOut('fast');
										$("#zh_animate3").fadeOut('fast');
										$("#zh_animate2").fadeOut('fast');
										$("#zh_animate1").fadeOut('fast');
										fgoThis.control_bgm("zh_bgm",0);
									},3000);
								},1000);
							},1000);
						},1000);
					},1000);
				}
				function animate_zh10(json)
				{
					//召唤动画
					//timers.debug=true;
					timers.clear();
			    timers.add(function(){
			      Picfade("zh_animate1",500,1);
			    },0,"动画画面1");
			    timers.add(function(){
			      Picfade("zh_animate2",500,1);
			    },1000,"动画画面2");
			    timers.add(function(){
			      Picfade("zh_animate3",500,1);
			    },1000,"动画画面3");
			    timers.add(function(){
			      Picfade("zh_animate4",500,1);
			    },1000,"动画画面4");
					//出卡动画，期间背景一直再变
			    for(var i in json)
			    {
			      (function(i){
			        timers.add(function(){
			          $("#zh_card").css("background","url(style/images/card/"+json[i]["url"]+")");
			          $("#zh_card").fadeIn(1500);
			          Picfade("zh_animate4",500,0);
			          Picfade("zh_animate3",500,0);
			        },1500,"开始出卡动画"+i);
			        timers.add(function(){
			          $("#zh_card").fadeOut(1000)
			          Picfade("zh_animate3",500,1);
			          Picfade("zh_animate4",500,1);
			        },1000,"关闭出卡动画"+i);
			      })(i);
			    }
			    timers.add(function(){
			      Picfade("zh_animate4",500,0);
			      Picfade("zh_animate3",500,0);
			      Picfade("zh_animate2",500,0);
			      Picfade("zh_animate1",500,0);
						fgoThis.zh_ten_ajax(json);
							Picfade("zh_10_result",500,1);
						fgoThis.control_bgm("zh_bgm",0);
			    },1000,"关闭所有动画和切换BGM,打开十连结果页面");
			    timers.start();
			    function Picfade(id,time,mode)
			    {
						//淡入或淡出元素
			        if(String(id).indexOf("#")!=0)
			        {
			          id="#"+id;
			        }
			        if(mode)
			        $(id).fadeIn(time);
			        else
			        $(id).fadeOut(time);
			    }

					// $("#zh_animate1").fadeIn(1500);
					// setTimeout(function(){
					// 	$("#zh_animate2").fadeIn(1500);
					// 	setTimeout(function(){
					// 		$("#zh_animate3").fadeIn(1500);
					// 		var k=0;
					// for(var i in json)
					// {
					// 	k++;
					// 	(function(i){
					// 		setTimeout(function(){
					// 			$("#zh_card").css("background","url(style/images/card/"+json[i]["url"]+")");
					// 			$("#zh_card").fadeIn(1500);
					// 			setTimeout('$("#zh_card").fadeOut(1000)',3500);
					// 		},5000*k);
					// })(i);
					// }
					// 		setTimeout(function(){
					// 			$("#zh_animate4").fadeIn(1500);
					// 				setTimeout(function(){
					// 					$("#zh_animate4").fadeOut('fast');
					// 					$("#zh_animate3").fadeOut('fast');
					// 					$("#zh_animate2").fadeOut('fast');
					// 					$("#zh_animate1").fadeOut('fast');
					// 					fgoThis.control_bgm("zh_bgm",0);
					// 				},55000);
					// 		},1000);
					// 	},1000);
					// },1000);
				}
				//召唤时隐藏按钮
				function zh_hide_btn(){
					$("#zh1").hide();
					$("#zh10").hide();
					$("#zh_info").hide();
					$(".function_pannel").hide(300);
					$(".zh_head").each(function(index, el) {
						$(el).hide();
					});
				}
				//召唤结束显示按钮
				function zh_show_btn(){
					$("#zh1").show();
					$("#zh10").show();
					$("#zh_info").show();
					$(".zh_head").show();
				}
				function getPush(){
					var j=[];
					var isGood=false;
					for (var i = 0; i < 10; i++) {
						var p=rn(1,50);
						//50%出从者
						if (p==1)
						{
							//2%出5星从者
							isGood=true;
							five_item=[];
							for(var l in item)
							{
								if(item[l]["type"]=="servent" && item[l]["level"]==5)
								five_item.push(item[l]);
							}
							var select=five_item[rn(0,five_item.length-1)]
							j.push({"id":select['id'],'url':'servent_five_'+select['id']+'.jpg'});
							continue;
						}
						if(p>1 && p<=4)
						{
							//6%出4星从者
							isGood=true;
							four_item=[];
							for(var l in item)
							{
								//4星从者不包括玛修
								if(item[l]["type"]=="servent" && item[l]["level"]==4 &&item[l]['id']!=41)
								four_item.push(item[l]);
							}
							var select=four_item[rn(0,four_item.length-1)]
							j.push({"id":select['id'],'url':'servent_four_'+select['id']+'.jpg'});
							continue;
						}
						if(p>4 && p<=45)
						{
							//82%出3星从者
							three_item=[];
							for(var l in item)
							{
								if(item[l]["type"]=="servent" && item[l]["level"]==3)
								three_item.push(item[l]);
							}
							var select=three_item[rn(0,three_item.length-1)]
							j.push({"id":select['id'],'url':'servent_three_'+select['id']+'.jpg'});
							continue;
						}
						if(p>45 && p<=48)
						{
							//6%出2星从者
							two_item=[];
							for(var l in item)
							{
								if(item[l]["type"]=="servent" && item[l]["level"]==2)
								two_item.push(item[l]);
							}
							var select=two_item[rn(0,two_item.length-1)]
							j.push({"id":select['id'],'url':'servent_two_'+select['id']+'.jpg'});
							continue;
						}
						if(p>48 && p<=50)
						{
							//4%出1星从者
							one_item=[];
							for(var l in item)
							{
								if(item[l]["type"]=="servent" && item[l]["level"]==1)
								one_item.push(item[l]);
							}
							var select=one_item[rn(0,one_item.length-1)]
							j.push({"id":select['id'],'url':'servent_one_'+select['id']+'.jpg'});
							continue;
						}
						//强化材料不再从卡池中出
						if(p>50)
						{
							//50%出强化材料
							if(p>85 && p<=100)
							{
								//15%出1星强化材料
								one_item=[];
								for(var l in item)
								{
									if(item[l]["type"]=="item" && item[l]["level"]==1)
									one_item.push(item[l]);
								}
								var select=one_item[rn(0,one_item.length-1)]
								j.push({"id":select['id'],'url':'item_one_'+select['id']+'.jpg'});
								continue;
							}
							if(p>70 && p<=85)
							{
								//15%出2星强化材料
								two_item=[];
								for(var l in item)
								{
									if(item[l]["type"]=="item" && item[l]["level"]==2)
									two_item.push(item[l]);
								}
								var select=two_item[rn(0,two_item.length-1)]
								j.push({"id":select['id'],'url':'item_two_'+select['id']+'.jpg'});
								continue;
							}
							if(p>58 && p<=70)
							{
								//12%出3星强化材料
								three_item=[];
								for(var l in item)
								{
									if(item[l]["type"]=="item" && item[l]["level"]==3)
									three_item.push(item[l]);
								}
								var select=three_item[rn(0,three_item.length-1)]
								j.push({"id":select['id'],'url':'item_three_'+select['id']+'.jpg'});
								continue;
							}
							if(p>50 && p<=58)
							{
								//8%出4星强化材料
								four_item=[];
								for(var l in item)
								{
									if(item[l]["type"]=="item" && item[l]["level"]==4)
									four_item.push(item[l]);
								}
								var select=four_item[rn(0,four_item.length-1)]
								j.push({"id":select['id'],'url':'item_four_'+select['id']+'.jpg'});
								continue;
							}
						}
					}
					//10连补救策略
					if(isGood==false){
						let p=rn(1,100);
						if(p>80){
							//补救一张4星从者
							four_item=[];
							for(var l in item)
							{
								//4星从者不包括玛修
								if(item[l]["type"]=="servent" && item[l]["level"]==4 &&item[l]['id']!=41)
								four_item.push(item[l]);
							}
							var select=four_item[rn(0,four_item.length-1)]
							j.push({"id":select['id'],'url':'servent_four_'+select['id']+'.jpg'});
						}else{
							//补救一张经验卡
							four_item=[];
							for(var l in item)
							{
								if(item[l]["type"]=="item" && item[l]["level"]==4)
								four_item.push(item[l]);
							}
							var select=four_item[rn(0,four_item.length-1)];
							j[rn(1,9)]={"id":select['id'],'url':'item_four_'+select['id']+'.jpg'};
						}
					}
					return j;
				}
			},
			tj:function(){
					//根据后台图鉴数据生成图鉴列表
					var servent_num=0;
					var item_num=0;
					$("#tj_body").empty();
					var strVar = "";
					var level_things=[];
					/*
						0 : one/two/three/four/five
						1 : border color|stars color
						2 : fake border image url
					*/
					var special_face={};//咕哒子化的从者使用强化一卡牌作为图鉴face
					//find函数
					special_face.find=function(el){
						var bool=false;
						for(_in in special_face)
						{
							if(_in==el)
							{
								bool=true;
								return bool;
							}
						}
						return bool;
					}
					var face_img=[];//对应的card图片路径
					for(var i in item)
					{
						//console.log(typeof item[i]["level"]);
						switch(item[i]["level"])
						{
							case '1':level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=(item[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case '2':level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=(item[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case '3':level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=(item[i]["type"]=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
							break;
							case '4':level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=(item[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case '5':level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=(item[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case 1:level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=(item[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case 2:level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=(item[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case 3:level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=(item[i]["type"]=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
							break;
							case 4:level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=(item[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case 5:level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=(item[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
						}
						if(special_face.find(item[i]["id"]))
						{
							face_img.push(item[i]["type"]+"_"+level_things[0]+"_"+item[i]["id"]+"_strength1.jpg");
						}
						else{
							//console.log(level_things[0])
							face_img.push(item[i]["type"]+"_"+level_things[0]+"_"+item[i]["id"]+".jpg");
						}
						if(item[i]['type']=='servent')servent_num++;
						if(item[i]['type']=='item')item_num++;
						if(item[i]['type']=='servent')
				    strVar += "<div class=\"tj_item mouse-hand\" id=\"tj_item"+item[i]["id"]+"\" style=\"background:url('style/images/card/"+face_img[i]+"');background-position:60% 10%;background-repeat:no-repeat;border:2px "+level_things[1]+" solid;border-bottom:0px #000 solid;\">\n";
						if(item[i]['type']=='item')
						strVar += "<div class=\"tj_item mouse-hand\" id=\"tj_item"+item[i]["id"]+"\" style=\"background:url('style/images/card/"+face_img[i]+"');background-position:50% 45%;background-repeat:no-repeat;border:2px "+level_things[1]+" solid;border-bottom:0px #000 solid;\">\n";
						if(item[i]['type']=='servent')
				    	strVar += "	<div class=\"tj_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:1px 1px 1px #222;'>\n";
						else
							strVar += "	<div class=\"tj_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:1px 1px 1px #222;background-color:#ddd;'>\n";
						var name="";
						name=(item[i]["name"].length<=6?item[i]["name"]:(item[i]["name"].indexOf("·")>-1?(item[i]["name"].substr(0,item[i]["name"].indexOf("·"))):(item[i]["name"].indexOf("(")>-1?(item[i]["name"].substr(0,item[i]["name"].indexOf("("))):item[i]["name"])));
				    strVar += "<span style=\"color:"+level_things[1]+";font-size:0.5em;\">"+"★★★★★".slice(0,item[i]["level"])+"<\/span>"+"<br/>"+name;
				    strVar += "	<\/div>\n";
				    strVar += "	<div class=\"tj_item_bottom_img\" style=\"background: url(\'style/images/"+level_things[2]+"\');\">\n";
						//console.log(level_things[2]);

				    strVar += "	<\/div>\n";
				    strVar += "<\/div>\n";
					}
					$("#tj_num_servent").text(servent_num);
					$("#tj_num_item").text(item_num);
					$("#tj_body").append(strVar);
					//绑定点击事件，查看大图
					for (var i in item)
					{
						var id="#tj_item"+item[i]["id"];
						var img="style/images/card/"+face_img[i];
						(function(id,imgurl){
						$(id).click(function(event) {
							$("#tj_card").css("background","url('"+imgurl+"')");
							$("#tj_card").fadeIn(300);
							$("#tj_shadow").fadeIn();
							$("#tj_shadow").click(function(event) {
								$("#tj_card").fadeOut();
								$(this).fadeOut();
							});
						});
					})(id,img);
					}
				},
			wp:function(){
				//根据后台图鉴数据生成图鉴列表
				var servent_num=0;
				var item_num=0;
				$("#wp_body").empty();
				var strVar = "";
				var level_things=[];
				/*
					0 : one/two/three/four/five
					1 : border color|stars color
					2 : fake border image url
				*/
				var special_face={};//咕哒子化的从者使用强化一卡牌作为图鉴face
				//find函数
				special_face.find=function(el){
					var bool=false;
					for(_in in special_face)
					{
						if(_in==el)
						{
							bool=true;
							return bool;
						}
					}
					return bool;
				}
				var face_img=[];//对应的card图片路径
				for(var i in Myitem)
				{
					//console.log(typeof Myitem[i]["level"]);
					switch(Myitem[i]["level"])
					{
						case '1':level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case '2':level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case '3':level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=(Myitem[i]["type"]=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
						break;
						case '4':level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=(Myitem[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
						case '5':level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=(Myitem[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
						case 1:level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case 2:level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case 3:level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=(Myitem[i]["type"]=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
						break;
						case 4:level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=(Myitem[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
						case 5:level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=(Myitem[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
					}
					if(special_face.find(Myitem[i]["itemid"]))
					{
						face_img.push(Myitem[i]["type"]+"_"+level_things[0]+"_"+Myitem[i]["itemid"]+"_strength1.jpg");
					}
					else{
						if(parseInt(Myitem[i]['exp'])<=20 || parseInt(Myitem[i]["strength"])==0)
						face_img.push(Myitem[i]["type"]+"_"+level_things[0]+"_"+Myitem[i]["itemid"]+".jpg");
						else {
							var real_card_num=parseInt(parseInt(Myitem[i]['exp'])/20)>parseInt(Myitem[i]['strength'])?parseInt(Myitem[i]['strength']):parseInt(parseInt(Myitem[i]['exp'])/20);
							face_img.push(Myitem[i]["type"]+"_"+level_things[0]+"_"+Myitem[i]["itemid"]+"_strength"+real_card_num+".jpg");
						}
					}
					if(Myitem[i]['type']=='servent')servent_num++;
					if(Myitem[i]['type']=='item')item_num++;
					if(Myitem[i]['type']=='servent')
					strVar += "<div class=\"wp_item mouse-hand\" id=\"wp_item"+Myitem[i]["id"]+"\" style=\"background:url('style/images/card/"+face_img[i]+"');background-position:60% 10%;background-repeat:no-repeat;border:2px "+level_things[1]+" solid;border-bottom:0px #000 solid;\">\n";
					if(Myitem[i]['type']=='item')
					strVar += "<div class=\"wp_item mouse-hand\" id=\"wp_item"+Myitem[i]["id"]+"\" style=\"background:url('style/images/card/"+face_img[i]+"');background-position:50% 45%;background-repeat:no-repeat;border:2px "+level_things[1]+" solid;border-bottom:0px #000 solid;\">\n";
					if(Myitem[i]['type']=='servent')
						strVar += "	<div class=\"wp_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:1px 1px 1px #000033;'>\n";
					else
						strVar += "	<div class=\"wp_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:0.5px 0.5px 1px #222;background-color:#ddd;'>\n";
					var name="";
					name=(Myitem[i]["name"].length<=6?Myitem[i]["name"]:(Myitem[i]["name"].indexOf("·")>-1?(Myitem[i]["name"].substr(0,Myitem[i]["name"].indexOf("·"))):(Myitem[i]["name"].indexOf("(")>-1?(Myitem[i]["name"].substr(0,Myitem[i]["name"].indexOf("("))):Myitem[i]["name"])));
					strVar += "<span style=\"color:"+level_things[1]+";font-size:0.5em;\">"+"★★★★★".slice(0,Myitem[i]["level"])+"<\/span>"+"<br/>"+name;
					if(Myitem[i]['type']=='servent')
					strVar+="<br/><span class='wp_servent_lv'>LV:"+Myitem[i]['exp']+"</span>";
					strVar += "	<\/div>\n";
					strVar += "	<div class=\"wp_item_bottom_img\" style=\"background: url(\'style/images/"+level_things[2]+"\');\">\n";
					//console.log(level_things[2]);

					strVar += "	<\/div>\n";
					strVar += "<\/div>\n";
				}
				$("#wp_num_servent").text(servent_num);
				$("#wp_num_item").text(item_num);
				$("#wp_body").append(strVar);
				//绑定点击事件，查看大图
				for (var i in Myitem)
				{
					var id="#wp_item"+Myitem[i]["id"];
					var img="style/images/card/"+face_img[i];
					(function(id,imgurl){
					$(id).click(function(event) {
						$("#wp_card").css("background","url('"+imgurl+"')");
						$("#wp_card").fadeIn(300);
						$("#wp_shadow").fadeIn();
						$("#wp_shadow").click(function(event) {
							$("#wp_card").fadeOut();
							$(this).fadeOut();
						});
					});
				})(id,img);
				}
			},
			gg:function(){
				$("#gg_body").empty();
				var strVar = "";
				for (var i in GG)
				{
			    strVar += "<div class=\"gg_each text-noselect mouse-hand\" id=\"gg_each"+GG[i]["id"]+"\">\n";
			    strVar += GG[i]["title"];
			    strVar += "<\/div>\n";
			    strVar += "<div class=\"gg_each_content\" id=\"gg_each_content"+GG[i]["id"]+"\">\n";
					strVar += GG[i]["content"];
			    strVar += "<\/div>\n";
				}
				$("#gg_body").append(strVar);
				for(var i in GG)
				{
					var id1="#gg_each"+GG[i]["id"];
					var id2="#gg_each_content"+GG[i]["id"];
					$(id1).val('0'); //未打开状态
					(function(id1,id2){
						$(id1).click(function(event) {
							if($(this).val()=='0'||$(this).val()==0)
							{
								//打开内容
								$(this).val('1');
								$(id2).fadeIn();
								$(id2).animate({'height':'400px'},1000);
							}else{
								//关闭内容
								$(this).val('0');
								$(id2).animate({'height':'0px'},1000);
								$(id2).fadeOut();
							}
						});
					})(id1,id2);
				}
			},
			qh:function(){
				//获取素材数据,在进行一次强化时会再次获取
				fgoThis.get_qh_item();
				fgoThis=this;
				//点击强化英灵
				$("#qh_submit").click(function(event) {
					if(parseInt($("#qh_choose_item").val())>0)
					{
						var servent_id=$("#qh_choose_card").val().substr($("#qh_choose_card").val().indexOf("m")+1,$("#qh_choose_card").val().length);
						var item_id=[];
						$(".qh_item_box").each(function(index, el) {
							if($(el).attr("data-item-id")!="0")
							{
								var id=$(el).attr("data-item-id").substr($(el).attr("data-item-id").indexOf("m")+1,$(el).attr("data-item-id").length);
								item_id.push(parseInt(id,10));
								$(el).css("background-image","");
								}
						});
						$("#qh_choose_item").val('0');
						$.ajax({
									cache: false,
									async: false,
									contentType: "application/x-www-form-urlencoded; charset=utf-8",
									url: 'source/php/qh.php',
									type: "POST",
									traditional: true,
									data: {'inf': 'update','user':$.cookie("fgo-user"),'servent_id':servent_id,'item_id':JSON.stringify(item_id)},
									error: function(e){
											 console.dir(e);
									},
									success:function (data)
									{
										if(data==true || data=="true")
										{
											//console.log("强化成功");
											var allexp1=0,exp1=0,allexp2=0,exp2=0,strength=0;
											for(var i in Myservent_qh)
											{
												if(Myservent_qh[i]["id"]==servent_id)
												{
														allexp1=Myservent_qh[i]["allexp"];
														exp1=Myservent_qh[i]["exp"];
														strength=Myservent_qh[i]["strength"];
												}
											}
											//刷新数据
											fgoThis.get_qh_item();
											fgoThis.get_qh_servent();
											for(var i in Myservent_qh)
											{
												if(Myservent_qh[i]["id"]==servent_id)
												{
														$("#qh_level").html(Myservent_qh[i]["exp"]);
														allexp2=Myservent_qh[i]["allexp"];
														exp2=Myservent_qh[i]["exp"];
												}
											}
											//显示强化的经验上升动画
											qh_animate(allexp1,exp1,allexp2,exp2,strength);
										}else{
											console.log("数据没有全部添加成功")
										}
									}
							 });
					}
				});
				//选择强化从者的页面的返回按钮
				$("#qh2_back_btn").click(function(event) {
					$("#qh2").hide();
					$("#qh_choose_item").css("background-image","");
					//取消已选择的从者
					$("#qh_choose_card").css("background-image","");
					//取消所有选择的素材卡
					$(".qh_item_box").each(function(index, el) {
							$(el).attr("data-item-id","0");
							$(el).css("background-image","");
					});
					//取消素材卡的标记选择状态
					if(Myitem_qh.length>0)
					{
						for(var k in Myitem_qh)
						{
							Myitem_qh[k]["check"]="no";
						}
					}
					//清零qh_choose_item的计数
					$("#qh_choose_item").val('0');
					$("#qh_choose_card").show();
					$("#qh_level").html("~");
					$("#qh_level_all").html("~");
				});
				$("#qh3_back_btn").click(function(event) {
					//从选素材界面回到强化界面
					$("#qh2").hide();
					$("#qh_choose_card").show();
					//选从者页面的head打开
					$("#qh2_head").show();
					//关闭选物品页面的head
					$("#choose_item_head").hide();
				});
				//选择强化从者的点击事件
				$("#qh_choose_card").click(function(event) {
						//收起下方的页面切换按钮
						$(".function_pannel").css("opacity","0.3");
						$("#qh2").show();
						$("#qh_choose_card").hide();
						fgoThis.get_qh_servent();
				});
				$("#qh_choose_item").click(function(event) {
					if($("#qh_choose_card").css("background-image")=='none')
					{
						console.log("没有选从者,不能选素材卡")
					}else{
						$(".function_pannel").css("opacity","0.3");
						$("#qh2").show();
						$("#qh_choose_card").hide();
						//选从者页面的head关闭
						$("#qh2_head").hide();
						//打开选物品页面的head
						$("#choose_item_head").show();
						//拉取item数据并渲染
						fgoThis.get_qh_item();
				  }
				});
				function qh_animate(a1,e1,a2,e2,strength)
				{
					if(e1==e2)
					{
						//等级没变
						//var w1=$("#qh_exp_get").css("width");
						var w2=((a2-allexp_from_zero_level(e1))/(level_exp(e1))*100).toFixed(2);
						$("#qh_exp_remain").text(level_exp(e2)-a2+allexp_from_zero_level(e2));
						if(w2<3)
						{
							$("#qh_exp_get").animate({'width':'3%'},1000);
						}else{
								$("#qh_exp_get").animate({'width':w2+'%'},1000);
						}
					}
					else{
						//等级升高
						$("#qh_exp_get").animate({'width':'100%'},800);
						setTimeout(function(){
							$("#qh_exp_get").css("width","0%");
							var w2=((a2-allexp_from_zero_level(parseInt(e2)))/(level_exp(e2))*100).toFixed(2);
							$("#qh_exp_remain").text(level_exp(e2)-a2+allexp_from_zero_level(parseInt(e2)));
							//判断是否需要因为升级更换卡牌
							if(parseInt(e2/20)>parseInt(e1/20))
							{
								//需要更换卡面
								if(parseInt(strength)>parseInt(e1/20) && parseInt(strength)>0)
								{
									//有卡面需要更换
									var url=$("#qh_choose_card").css("background-image");
									if(url.indexOf("strength")==-1)
									{
										url=url.substr(0,url.indexOf(".jpg"));
										url=url+"_strength1.jpg\")";
										$("#qh_choose_card").css("background-image",url);
									}else{
										var now_strength=parseInt(url.substr(url.indexOf("strength")+8,url.indexOf(".")));
										if(now_strength<strength)
										{
											//有更换余地，更换
											var real_card_num=now_strength+1;
											url=url.substr(0,url.indexOf(".jpg")-1);
											url=url+String(real_card_num)+".jpg\")";
											$("#qh_choose_card").css("background-image",url);
										}
										//console.log(url.substr(url.indexOf("strength")+8,url.indexOf(".jpg")),now_strength);
									}
								}
							}
							setTimeout(function(){
									if(w2>3)
									{
										$("#qh_exp_get").animate({'width':w2+'%'},1000);
									}else{
										$("#qh_exp_get").animate({'width':'3%'},1000);
									}
							},500);
						},900);
					}
				}
			},
			dg:function(){
				var fgoThis=this;
				//加载已经打工的从者
				this.get_dg_working_servent();
				//加载最大打工从者数量
				this.get_dg_block_num();
				//点击派遣从者打工
				//dg2页面右上角决定选择按钮
				$("#dg_check").click(function(event) {
					$("#dg_back_btn").trigger('click');
				});
				$("#dg_post").unbind('click').click(function(event) {
					//点击后禁用dg按钮,防止重复点击重复加钱
					$("#dg_post").attr("disabled",true);
					$("#dg_money_text").attr("show-servent")==undefined?$("#dg_money_text").attr("show-servent",0):$("#dg_money_text").attr("show-servent",0);
					var serventid=[];
					for(var i in Myservent_dg)
					{
						if(Myservent_dg[i]["check"]=="yes")
						{
							serventid.push(Myservent_dg[i]["id"])
						}
					}
					fgoThis.post_dg(serventid);
					//成功,刷新玩家召唤页面的金钱数据,打工页面的打工状态及时间显示，更新选择打工列表,防止重复选择
					fgoThis.get_dg_servent();
					fgoThis.get_dg_working_servent();
					fgoThis.get_dg_num();
				});
				//购买打工位
				$("#buy_dg_block").click(function(event) {
					//获取用户的blocknum和dg_block，并且计算下一个打工位的价钱
					var dg_block=parseInt($("#dg_cont").attr("max-block"),10);
					var num=My_SPHINX||0;
					var next_num=parseInt(price_dg_block(dg_block),10);
					//#00CC33
					var st='';
					if(num>=next_num)
					{
						str="master,您现在拥有<span style='color:#6633CC;'>"+dg_block+"</span>个打工位<br/>您现在一共有<span style='color:#6633CC;'>"+num+"</span>个SPHINX$<br/>购买下一个打工位需要<span style='color:#FF3333;'>"+next_num+"</span>元<br/>购买完后您还剩余<span style='color:#6633CC;'>"+(num-next_num)+"</span>个SPHINX$<br/>请问您是否购买?";
						$("#buy_dg_block_yes").attr("disabled",false);
					}
					else {
						str="master,您现在拥有<span style='color:#6633CC;'>"+dg_block+"</span>个打工位<br/>您现在一共有<span style='color:#6633CC;'>"+num+"</span>个SPHINX$<br/>购买下一个打工位需要<span style='color:#00CC33;'>"+next_num+"</span>元<br/>您还需<span style='color:#00CC33'>"+(next_num-num)+"</span>个SPHINX$才能购买下一个打工位<br/>请加油打工吧!(๑•̀ㅂ•́)و✧";

						$("#buy_dg_block_yes").attr("disabled","true");
					}
					$("#dg_block_text").html(str);
					$("#buy_dg_block_model").show();
				});
				//关闭购买打工位提示
				$("#buy_dg_block_no").click(function(event) {
					$("#buy_dg_block_model").hide();
				});
				//确认购买打工位
				$("#buy_dg_block_yes").click(function(event) {
					$("#buy_dg_block_yes").attr("disabled",true);
					$("#buy_dg_block_no").attr("disabled",true);
					fgoThis.get_buy_dg_block();
				});
				function clear_all_check_dg_servent(){
					for(var i in Myservent_dg)
					{
						var id="#dg_item"+Myservent_dg[i]["id"];
						if(Myservent_dg[i]["check"]=="yes")
						{
							Myservent_dg[i]["check"]="no";
							$(id).val('0');//表示取消这个材料
							$("#dg_cont").val(parseInt($("#dg_cont").val(),10)-1);
							$(id).removeClass('dg_item_select');
							var shiftel=null;var shift=false;
							$(".dg_box").each(function(index, el) {
								if($(el).attr("data-item-id")==id)
								{
									$(el).attr("data-item-id","0");
									$(el).css("background","");
									$(el).find(".dg_servent_text").text('');
									$(el).find(".dg_servent_text").css("height","0px");
									shift=true;//需要把后一个移到前一个去
									shiftel=el;
								}else{
									if(shift&&shiftel!=null)
									{
										if($(el).find(".dg_servent_text").text().length>0)
										{
												$(shiftel).css("background",$(el).css('background'));
												$(shiftel).attr("data-item-id",$(el).attr("data-item-id"));
												$(shiftel).find(".dg_servent_text").css("height","70px");
												$(shiftel).find(".dg_servent_text").text($(el).find(".dg_servent_text").text());
												shiftel=el;
												$(el).css("background","");
												$(el).find(".dg_servent_text").css("height","0");
												$(el).find(".dg_servent_text").text("");
										}
										else{
											shiftel=null;
											shift=false;
										}
									}
								}
							});
						}
					}
				}
				$("#dg_cont").click(function(event) {
					//给空位选择要派遣去打工的从者或者更换要派遣去打工的从者
					$("#dg_cont").val()==''?$("#dg_cont").val('0'):false;
					if(parseInt($("#dg_cont").val())<parseInt($("#dg_cont").attr("max-block"),10) || (fgoThis.Servent_nocheck()>0&&parseInt($("#dg_cont").val())==parseInt($("#dg_cont").attr("max-block"),10)))
					{
						//选择或更换打工的servent
						//收起下方的页面切换按钮
						$(".function_pannel").css("opacity","0.3");
						//关闭8个打工从者显示box
						$("#dg_cont").hide();
						//关闭底部按钮显示
						$("#dg_bottom_btn").hide();
						//隐藏右上角的派遣打工按钮
						$("#dg_post").hide();
						$("#dg2").show();
						$("#dg_check").show();
						fgoThis.get_dg_servent();
					}
				});
				$("#dg_get_money_cancle").click(function(event) {
					$("#dg_money_text").html("");
					$("#dg_get_money").hide();
					//清空打工从者列表，不再提示打工完成
					Working_servent_time=[];
					fgoThis.get_dg_time();
					//重新渲染正在打工的从者
					fgoThis.get_dg_working_servent();
				});

				if(parseInt($("#dg_cont").val(),10)>0)
				{
					//开启动态更换打工时间显示
					Working_servent_time_idlist=[];
					for(var i in Working_servent)
					{
						Working_servent_time_idlist.push(Working_servent[i]["myitemid"]);
					}
					fgoThis.get_dg_working_time(Working_servent_time_idlist);
				}
			},
			jy:function(){
				fgoThis=this;
				//获取交易信息并渲染商品数据
				fgoThis.get_jy_data();
				//发布页面的右上方按钮的初始值
				$("#jy_change").attr("data-mode",'0');
				//点击发布交易按钮,打开model并加载数据
				$("#jy_change_item_btn").unbind('click').bind('click',function(event) {
					$("#jy_model").show();
					$("#jy_shadow").show();
					//设置发布交易页面显示
					$("#jy_servent_add").show();
					$("#jy_manage_panel").hide();
					//发布页面的右上方按钮的初始值
					//切换到发布交易
					$("#jy_model_title").text("发布交易");
					$("#jy_change").text("管理");
					$("#jy_change").attr("data-mode",'0');
					$("#jy_manage_panel").hide();
					$("#jy_servent_add").show();
					fgoThis.get_sell_servent();
					fgoThis.get_sold_servent();
				});
				//点击管理按钮,切换删除售卖从者页面，更换title和该按钮的样式文字
				$("#jy_change").unbind('click').bind('click',function(event) {
					//$("#jy_change").attr("data-mode")==undefined||'undefined'||''?$("#jy_change").attr("data-mode",'0'):$("#jy_change").attr("data-mode");
					if($("#jy_change").attr("data-mode")=='0')
					{
							//切换到管理交易
							$("#jy_model_title").text("管理交易");
							$("#jy_change").text("发布");
							$("#jy_change").attr("data-mode",'1');
							$("#jy_manage_panel").show();
							$("#jy_servent_add").hide();
					}else{
							//切换到发布交易
							$("#jy_model_title").text("发布交易");
							$("#jy_change").text("管理");
							$("#jy_change").attr("data-mode",'0');
							$("#jy_manage_panel").hide();
							$("#jy_servent_add").show();
					}
				});
				//点击jy_model发布交易的取消按钮
				$("#jy_button_cancel").unbind('click').bind('click',function(event) {
					$("#jy_model").hide();
					$("#jy_shadow").hide();
				});
				//点击jy_model管理交易的取消按钮
				$("#jy_button_cancel2").unbind('click').bind('click',function(event) {
					$("#jy_model").hide();
					$("#jy_shadow").hide();
				});
				//jy_model里的select的验证状态
				$("#jy_sale_servent_list").change(function(event) {
					//console.log($("#jy_sale_servent_list").find("option:selected").text(),$("#jy_sale_servent_list").find("option:selected").attr('id'));
					if($("#jy_sale_servent_list").find("option:selected").attr("id")!="jy_sale_servent_default")
					{
						$("#jy_sale_servent_div").removeClass('has-warning');
						$("#jy_sale_servent_div").addClass('has-success');
						$("#jy_sell_servent_btn").attr("disabled",false);
					}else{
						$("#jy_sale_servent_div").removeClass('has-success');
						$("#jy_sale_servent_div").addClass('has-warning');
						$("#jy_sell_servent_btn").attr("disabled",true);
					}
				});
				//jy_model里的price输入验证状态
				$("#jy_price").change(function(event) {

					if(!isNaN($("#jy_price").val()) && parseInt($("#jy_price").val(),10)>0)
					{
						//数字大于0
						$("#jy_price_div").removeClass('has-warning');
						$("#jy_price_div").addClass('has-success');
						$("#jy_sell_servent_btn").attr("disabled",false);
					}else{
						$("#jy_price_div").removeClass('has-success');
						$("#jy_price_div").addClass('has-warning');
						$("#jy_sell_servent_btn").attr("disabled",true);
					}
				});
				//jy_model里的select的验证状态(管理交易)
				$("#jy_sold_servent_list").change(function(event) {
					//console.log($("#jy_sold_servent_list").find("option:selected").text(),$("#jy_sold_servent_list").find("option:selected").attr('id'));
					if($("#jy_sold_servent_list").find("option:selected").attr("id")!="jy_sold_servent_default")
					{
						$("#jy_sold_servent_div").removeClass('has-warning');
						$("#jy_sold_servent_div").addClass('has-success');
						$("#jy_sold_servent_btn").attr("disabled",false);
					}else{
						$("#jy_sold_servent_div").removeClass('has-success');
						$("#jy_sold_servent_div").addClass('has-warning');
						$("#jy_sold_servent_btn").attr("disabled",true);
					}
				});
				//点击出售按钮
				$("#jy_sell_servent_btn").unbind('click').bind('click',function(event) {
					//禁用当前按钮
					$("#jy_sell_servent_btn").attr("disabled",true);
					//获取选择的id和价格
					var price=$("#jy_price").val();
					var id=$("#jy_sale_servent_list").find("option:selected").attr("id").replace(/jy_sale_servent/,'');
					if(!isNaN(id)&&!isNaN(price)&&price.length>0)
					{
						//发送添加交易的请求
						fgoThis.sell_servent(id,price);
					}
				});
				//点击撤销出售的按钮
				$("#jy_sold_servent_btn").unbind('click').bind('click',function(event) {
					//禁用当前按钮
					$("#jy_sold_servent_btn").attr("disabled",true);
					//获取选择的id和价格
					var id=$("#jy_sold_servent_list").find("option:selected").attr("id").replace(/jy_sold_servent/,'');
					if(!isNaN(id))
					{
						//发送添加交易的请求
						fgoThis.cancel_sold_servent(id);
					}
				});

				//点击jy_info的取消按钮
				$("#jy_info_cancle").unbind('click').bind('click',function(event) {
					$("#jy_info_model").hide();
					$("#jy_shadow").hide();
				});
			},
			zh_10_result_show:function(itemdata){
				//10次召唤后的结果页面的数据渲染
				var servent_num=0;
				var item_num=0;
				$("#zh_10_result").empty();
				var strVar = "<div class=\"zh_10_result_head\"><div id=\"zh_10_result_back_btn\" class=\"mouse-hand\"></div></div>";
				var level_things=[];
				/*
					0 : one/two/three/four/five
					1 : border color|stars color
					2 : fake border image url
				*/
				var special_face={};//咕哒子化的从者使用强化一卡牌作为图鉴face
				//find函数
				special_face.find=function(el){
					var bool=false;
					for(_in in special_face)
					{
						if(_in==el)
						{
							bool=true;
							return bool;
						}
					}
					return bool;
				}
				var face_img=[];//对应的card图片路径
				var cl="#zh_10_result_item";
				for(var i in itemdata)
				{
					//console.log(typeof itemdata[i]["level"]);
					switch(itemdata[i]["level"])
					{
						case '1':level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=(itemdata[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case '2':level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=(itemdata[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case '3':level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=(itemdata[i]["type"]=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
						break;
						case '4':level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=(itemdata[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
						case '5':level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=(itemdata[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
						case 1:level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=(itemdata[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case 2:level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=(itemdata[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case 3:level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=(itemdata[i]["type"]=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
						break;
						case 4:level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=(itemdata[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
						case 5:level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=(itemdata[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
					}
					if(special_face.find(itemdata[i]["id"]))
					{
						face_img.push(itemdata[i]["type"]+"_"+level_things[0]+"_"+itemdata[i]["id"]+"_strength1.jpg");
					}
					else{
						//console.log(level_things[0])
						face_img.push(itemdata[i]["type"]+"_"+level_things[0]+"_"+itemdata[i]["id"]+".jpg");
					}
					if(itemdata[i]['type']=='servent')
					strVar += "<div class=\"zh_10_result_item\" id=\"zh_10_result_item"+String(+i+1)+"\" style=\"background:url('style/images/card/"+face_img[i]+"');background-position:60% 10%;background-repeat:no-repeat;border:2px "+level_things[1]+" solid;border-bottom:0px #000 solid;\">\n";
					if(itemdata[i]['type']=='item')
					strVar += "<div class=\"zh_10_result_item\" id=\"zh_10_result_item"+String(+i+1)+"\" style=\"background:url('style/images/card/"+face_img[i]+"');background-position:50% 45%;background-repeat:no-repeat;border:2px "+level_things[1]+" solid;border-bottom:0px #000 solid;\">\n";
					if(itemdata[i]['type']=='servent')
						strVar += "	<div class=\"zh_10_result_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:1px 1px 1px #222;'>\n";
					else
						strVar += "	<div class=\"zh_10_result_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:1px 1px 1px #222;background-color:#ddd;'>\n";
					var name="";
					name=(itemdata[i]["name"].length<=6?itemdata[i]["name"]:(itemdata[i]["name"].indexOf("·")>-1?(itemdata[i]["name"].substr(0,itemdata[i]["name"].indexOf("·"))):(itemdata[i]["name"].indexOf("(")>-1?(itemdata[i]["name"].substr(0,itemdata[i]["name"].indexOf("("))):itemdata[i]["name"])));
					strVar += "<span style=\"color:"+level_things[1]+";font-size:0.5em;\">"+"★★★★★".slice(0,itemdata[i]["level"])+"<\/span>"+"<br/>"+name;
					strVar += "	<\/div>\n";
					strVar += "	<div class=\"tj_item_bottom_img\" style=\"background: url(\'style/images/"+level_things[2]+"\');\">\n";
					//console.log(level_things[2]);

					strVar += "	<\/div>\n";
					strVar += "<\/div>\n";
				}
				$("#zh_10_result").append(strVar);
				$("#zh_10_result_back_btn").unbind('click').click(function(event) {
					$("#zh_10_result").fadeOut();
					$(".function_pannel").show(500);
				});
			},
			jy_servent_options:function(){
				var str="<option id=\"jy_sale_servent_default\">请选择(正在打工的英灵不会显示)<\/option>\n";;
				for(var i in Sellitem)
				{
					var name=(Sellitem[i]["name"].length<=6?Sellitem[i]["name"]:(Sellitem[i]["name"].indexOf("·")>-1?(Sellitem[i]["name"].substr(0,Sellitem[i]["name"].indexOf("·"))):(Sellitem[i]["name"].indexOf("(")>-1?(Sellitem[i]["name"].substr(0,Sellitem[i]["name"].indexOf("("))):Sellitem[i]["name"])));
					str+="<option id=\"jy_sale_servent"+Sellitem[i]["id"]+"\">"+name+" "+"★★★★★".slice(0,Sellitem[i]["level"])+" LV:"+Sellitem[i]["exp"]+"</option>"
				}
				$("#jy_sale_servent_list").html(str);
			},
			jy_servent_options2:function(){
				var str="<option id=\"jy_sold_servent_default\">请选择想要取消售卖的英灵<\/option>\n";;
				for(var i in Solditem)
				{
					var name=(Solditem[i]["name"].length<=6?Solditem[i]["name"]:(Solditem[i]["name"].indexOf("·")>-1?(Solditem[i]["name"].substr(0,Solditem[i]["name"].indexOf("·"))):(Solditem[i]["name"].indexOf("(")>-1?(Solditem[i]["name"].substr(0,Solditem[i]["name"].indexOf("("))):Solditem[i]["name"])));
					str+="<option id=\"jy_sold_servent"+Solditem[i]["id"]+"\">"+name+" "+"★★★★★".slice(0,Solditem[i]["level"])+" LV:"+Solditem[i]["exp"]+"</option>"
				}
				$("#jy_sold_servent_list").html(str);
			},
			jy_append_item_data:function(){
				fgoThis=this;
				var strVar = "";
				$("#jy_body").empty();
				var face_img=[];//对应的card图片路径
				var level_things=[];
				for (var i in Myitem_jy){
					switch(Myitem_jy[i]["level"])
					{
						case '1':level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem_jy[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case '2':level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem_jy[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case '3':level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=(Myitem_jy[i]["type"]=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
						break;
						case '4':level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=(Myitem_jy[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
						case '5':level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=(Myitem_jy[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
						case 1:level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem_jy[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case 2:level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem_jy[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
						break;
						case 3:level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=(Myitem_jy[i]["type"]=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
						break;
						case 4:level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=(Myitem_jy[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
						case 5:level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=(Myitem_jy[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
						break;
					}
					if(parseInt(Myitem_jy[i]['exp'])<=20 || parseInt(Myitem_jy[i]["strength"])==0)
					face_img.push(Myitem_jy[i]["type"]+"_"+level_things[0]+"_"+Myitem_jy[i]["itemid"]+".jpg");
					else {
						var real_card_num=parseInt(parseInt(Myitem_jy[i]['exp'])/20)>parseInt(Myitem_jy[i]['strength'])?parseInt(Myitem_jy[i]['strength']):parseInt(parseInt(Myitem_jy[i]['exp'])/20);
						face_img.push(Myitem_jy[i]["type"]+"_"+level_things[0]+"_"+Myitem_jy[i]["itemid"]+"_strength"+real_card_num+".jpg");
					}
					var level_color="#FFF";
					switch(parseInt(parseInt(Myitem_jy[i]["exp"],10)/20,10)){
						case 0:level_color="#FFF";break;
						case 1:level_color="#FFF";break;
						case 2:level_color="rgb(177,177,177)";break;
						case 3:level_color="#FFCC00";break;
						case 4:level_color="#FFCC00";break;
					}
					strVar += "<div class=\"jy_item text-noselect\" id=\"jy_item"+Myitem_jy[i]["id"]+"\">\n";
					strVar += "	<div class=\"jy_pic\" id=\"jy_pic"+Myitem_jy[i]["id"]+"\" style=\"background:url('style/images/card/"+face_img[i]+"');background-position:60% 10%;background-repeat:no-repeat;border:2px "+level_things[1]+" solid;border-bottom:0px #000 solid;\">\n";
					strVar += "	<div class=\"jy_pic_bottom_img\" style=\"background: url(\'style/images/"+level_things[2]+"\');\"></div><\/div>\n";
					strVar += "	<div class=\"jy_sold_name\" id=\"jy_sold_name"+Myitem_jy[i]["id"]+"\">\n";
					strVar += "御主 <span style=\"color:"+level_things[1]+";\">"+Myitem_jy[i]["user"]+"</span>";
					strVar += "	<\/div>\n"+"<div class=\"jy_servent_level\">LV: <span style='color:"+level_color+";'>"+Myitem_jy[i]["exp"]+"</span> <span style=\"color:"+level_things[1]+";\">"+"★★★★★".slice(0,Myitem_jy[i]["level"])+"</span> </div>";
					strVar += "	<div class=\"jy_servent_name\" id=\"jy_servent_name"+Myitem_jy[i]["id"]+"\">\n";
					strVar += "		<span class=\"jy_servent_info\" id=\"jy_servent_info"+Myitem_jy[i]["id"]+"\">从者 "+
					"<span  style=\"color:"+level_things[1]+";\">"+Myitem_jy[i]["name"]+"</span>  <span style=\"color:"+level_things[1]+";font-size:1em;\">"+"★★★★★".slice(0,Myitem_jy[i]["level"])+"</span> LV: <span  style='color:"+level_color+";'>"+Myitem_jy[i]["exp"]+"</span><\/span>\n";
					strVar += "	<\/div>\n";
					strVar += "	<div class=\"jy_price\" id=\"jy_price"+Myitem_jy[i]["id"]+"\">\n";
					var price_color=My_SPHINX>parseInt(Myitem_jy[i]["price"],10)?"#FF3333":"#00CC33";
					strVar += "		价格 <span style='color:"+price_color+";'>"+Myitem_jy[i]["price"]+"</span> SPHINX$\n";
					strVar += "	<\/div>\n";
					strVar += "	<div class=\"jy_confirm\" id=\"jy_confirm"+Myitem_jy[i]["id"]+"\">\n";
					if(Myitem_jy[i]['user']==$.cookie('fgo-user'))
					{
							strVar += "		<button class=\"btn btn-warning jy_cancel_button\" id=\"jy_cancel_button"+Myitem_jy[i]["id"]+"\">撤销<\/button>\n";
					}else{
							if(My_SPHINX>=parseInt(Myitem_jy[i]["price"],10))
								strVar += "		<button class=\"btn btn-success jy_confirm_button\" id=\"jy_confirm_button"+Myitem_jy[i]["id"]+"\">购买<\/button>\n";
							else
								strVar += "		<button class=\"btn btn-success jy_confirm_button\" disabled id=\"jy_confirm_button"+Myitem_jy[i]["id"]+"\">购买<\/button>\n";
					}
					strVar += "	<\/div>\n";
					strVar += "<\/div>\n";
				}
				$("#jy_body").append(strVar);
				//绑定btn事件
				for(var i in Myitem_jy){
					var bid="#jy_confirm_button"+Myitem_jy[i]['id'];
					var cid="#jy_cancel_button"+Myitem_jy[i]['id'];
					var itemid=Myitem_jy[i]['myitemid'];
					var id=Myitem_jy[i]['id'];
					var click_type=Myitem_jy[i]['user']==$.cookie("fgo-user");
					(function(bid,cid,id,itemid,order,click_type){
						if(click_type){
							$(cid).unbind('click').click(function(event) {
								jy_info("Master确认要撤销改上架交易吗？",fgoThis.cancel_sold_servent,itemid);
							});
						}
						else{
							$(bid).unbind('click').click(function(event) {
								var buy_str="Master确认购买从者"+Myitem_jy[order]['name']+"吗?   "+"这将花费您"+Myitem_jy[order]['price']+"个SPHINX$.      购买后您将剩余"+(My_SPHINX-parseInt(Myitem_jy[order]['price']))+"个SPHINX$.";
								jy_info(buy_str,fgoThis.post_buy,id);
							});
						}
					})(bid,cid,id,itemid,i,click_type);
				}
				function jy_info(text,fn,arg){
					$("#jy_info_model").show();
					$("#jy_shadow").show();
					$("#jy_info_text").text(text);
					(function(fn,arg){
						$("#jy_info_ok").unbind('click').click(function(event) {
							fn.call(fgo,arg);
							$("#jy_info_model").hide();
							$("#jy_shadow").hide();
						});
					})(fn,arg);
					}
			},
			qh_exp_width:function(a1,e1){
				//显示强化页面的初始经验条长度和剩余升级数值
				var w=((a1-allexp_from_zero_level(e1))/(level_exp(e1))).toFixed(2)*100;
				$("#qh_exp_remain").text(level_exp(e1)-a1+allexp_from_zero_level(e1));
				if(w<3)
				{
					$("#qh_exp_get").css({'width':'3%'});
				}
				else{
					$("#qh_exp_get").css({'width':w+'%'});
				}

			},
			Servent_nocheck:function(){
					//检测Myservent_dg数组里的所有元素的check属性为'no'
					//返回num表示数组里有num个元素的check为yes
					//返回0表示数组里没有元素的check为yes,全部元素check=no
					if(Myservent_dg==undefined)return 0;
					var _check_num=0;
					if(Myservent_dg.length>0 && Myservent_dg instanceof Array)
					{
						for(var _i in Myservent_dg)
						{
							if(Myservent_dg[_i]["check"]=="yes")
							_check_num++;
						}
					}
					return _check_num;
			},
			dg_working_servent_append:function(){
				var fgoThis=this;
				$("#dg_cont").val('0');
				Myservent_dg=[];
				$(".dg_box").each(function(index, el) {
					$(el).css("background","");
					$(el).attr("data-item-id","");
				});
				$(".dg_servent_text").each(function(index, el) {
					$(el).text("");
					$(el).css("height","0px");
				});
				//显示正在打工的从者,以及还有多长时间打工结束
				var level_things=[];
				$("#dg_cont").val()==''?$("#dg_cont").val(0):false;
				for (var i in Working_servent){
					var num=parseInt($("#dg_cont").val());
					switch(parseInt(Working_servent[i]["level"]))
					{
						case 1:level_things[0]="one";
						break;
						case 2:level_things[0]="two";
						break;
						case 3:level_things[0]="three";
						break;
						case 4:level_things[0]="four";
						break;
						case 5:level_things[0]="five";
						break;
					}
					//纠正exp为等级
					Working_servent[i]["exp"]=exp_level(Working_servent[i]["exp"]);
					var id="#dg_item"+Working_servent[i]["id"];
					if(parseInt(Working_servent[i]['exp'])<=20 || parseInt(Working_servent[i]["strength"])==0)
						face_img=("servent"+"_"+level_things[0]+"_"+Working_servent[i]["id"]+".jpg");
					else {
						var real_card_num=parseInt(parseInt(Working_servent[i]['exp'])/20)>parseInt(Working_servent[i]['strength'])?parseInt(Working_servent[i]['strength']):parseInt(parseInt(Working_servent[i]['exp'])/20);
						// console.log(real_card_num,Working_servent[i]["exp"],Working_servent[i]["strength"]);
						face_img=("servent"+"_"+level_things[0]+"_"+Working_servent[i]["id"]+"_strength"+real_card_num+".jpg");
					}
					var img="url(style/images/card/"+face_img+") no-repeat 50% 25%";
					$("#dg_servent"+String(num+1)).css("background",img);
					//设置文字信息
					var timestamp = Date.parse(new Date());
					//console.log(timestamp/1000,+Working_servent[i]["beginwork"],timestamp/1000-(+Working_servent[i]["beginwork"]));
					var workingtime=parseInt(timestamp,10)/1000-parseInt(Working_servent[i]["beginwork"],10);
					var minute = Math.floor(workingtime%86400%3600/60)>15?15:Math.floor(workingtime%86400%3600/60);
					//var minute = Math.floor(parseInt(timestamp,10)%86400%3600/60);
					var name=(Working_servent[i]["name"].length<=6?Working_servent[i]["name"]:(Working_servent[i]["name"].indexOf("·")>-1?(Working_servent[i]["name"].substr(0,Working_servent[i]["name"].indexOf("·"))):(Working_servent[i]["name"].indexOf("(")>-1?(Working_servent[i]["name"].substr(0,Working_servent[i]["name"].indexOf("("))):Working_servent[i]["name"])));
					$("#dg_servent_text"+String(num+1)).css("height","95px");
					// $("#dg_servent_text"+String(num+1)).html(name+"正在打工!已打工"+minute+"分钟<span style='display:block'>"+emoji[rn(0,emoji.length-1)]+"</span>");
					$("#dg_servent_text"+String(num+1)).html(name+"正在打工!已打工"+minute+"分钟.预计收入"+parseInt(mine_percent(exp_level(Working_servent[i]["exp"]),Working_servent[i]["level"])*100,10)+"元<img src='style/images/mineral.gif' style='width:20px;height:20px;display:inline;' />");
					//记录id
					$("#dg_servent"+String(num+1)).attr("data-item-id",id);
					$("#dg_cont").val(num+1);
				}
				if(parseInt($("#dg_cont").val(),10)==8)
				{
					//禁用派遣打工按钮
					$("#dg_post").attr("disabled",true);
				}
				if(parseInt($("#dg_cont").val(),10)<8)
				{
					//启用派遣打工按钮
					$("#dg_post").attr("disabled",false);
				}
				if(parseInt($("#dg_cont").val(),10)>0)
				{
					//开启动态更换打工时间显示
					Working_servent_time_idlist=[];
					for(var i in Working_servent)
					{
						Working_servent_time_idlist.push(Working_servent[i]["myitemid"]);
					}
				  fgoThis.get_dg_working_time(Working_servent_time_idlist);
				}
			},
			dg_working_servent_refresh_sec:function(){
				var fgoThis=this;
				var num=0;
				for (var i in Working_servent_time){
					var timestamp = Date.parse(new Date());
					var workingtime=parseInt(timestamp,10)/1000-parseInt(Working_servent_time[i]["beginwork"],10);
					var minute = Math.floor(workingtime%86400%3600/60);
					var sec=Math.round(workingtime%86400%3600)-minute*60;
					var name=(Working_servent_time[i]["name"].length<=6?Working_servent_time[i]["name"]:(Working_servent_time[i]["name"].indexOf("·")>-1?(Working_servent_time[i]["name"].substr(0,Working_servent_time[i]["name"].indexOf("·"))):(Working_servent_time[i]["name"].indexOf("(")>-1?(Working_servent_time[i]["name"].substr(0,Working_servent_time[i]["name"].indexOf("("))):Working_servent_time[i]["name"])));
					if(minute<15)
					{
						$("#dg_servent_text"+String(num+1)).html("<span style='color:#6633CC;font-weight:bold;'>"+name+"</span>已打工<span style='color:#CC00FF;font-weight:bold;'>"+minute+"分"+sec+"秒</span>"+".预计收入<span style='color:#FF3333;font-weight:bold;margin-right:5px;'>"+parseInt(mine_percent((Working_servent_time[i]["exp"]),Working_servent_time[i]["level"])*100,10)+"元</span><img src='style/images/mineral.gif' style='width:20px;height:20px;display:inline;' />");
						num++;
					}else{
						if($("#dg_get_money").css("display")=="none")
						{
							$("#dg_get_money").show();
						}
						(function(){
							var str=$("#dg_money_text").html();
							$("#dg_money_text").attr("show-servent")==undefined?$("#dg_money_text").attr("show-servent",0):false;
							for (var k=0;k<Working_servent_time.length;k++) {
								if(Working_servent_time[k]!=undefined && parseInt($("#dg_money_text").attr("show-servent"),10)<=k)
								{
									var timestamp = Date.parse(new Date());
									var workingtime=parseInt(timestamp,10)/1000-parseInt(Working_servent_time[k]["beginwork"],10);
									var minute = Math.round(workingtime%86400%3600/60);
									var name=(Working_servent_time[i]["name"].length<=6?Working_servent_time[k]["name"]:(Working_servent_time[k]["name"].indexOf("·")>-1?(Working_servent_time[k]["name"].substr(0,Working_servent_time[k]["name"].indexOf("·"))):(Working_servent_time[k]["name"].indexOf("(")>-1?(Working_servent_time[k]["name"].substr(0,Working_servent_time[k]["name"].indexOf("("))):Working_servent_time[k]["name"])));
									if(minute>=15)
									{
										//console.log(Working_servent_time);
										var _exp=Working_servent_time[k]["exp"];
										var _level=Working_servent_time[k]["level"];
										var money=parseInt(mine_percent(_exp,_level)*100,10);
										var show_servent_num=parseInt($("#dg_money_text").attr("show-servent"));
										$("#dg_money_text").attr("show-servent",show_servent_num+1);
										str+="<span style='color:#6633CC;'>"+name+"</span>打工结束了,为master赚了<span style='color:#FF3333;'>"+money+"</span>元.<br/>";
										let options={
											status:'success',
											text:"您的从者"+name+"打工结束了,为master赚了"+money+"元,快去看看吧.",
											click:dg_msg_click,
											type:2
										}
										let msg=new Notify(options);
									}
								}
							}
							$("#dg_money_text").html(str);
						})();
					}
				}
			},
			dg_append_servent_data:function(){
				//渲染check后打工主页面的准备显示
				fgoThis=this;
				if(Myservent_dg.length>=0)
				{
					//根据后台图鉴数据生成图鉴列表
					var servent_num=0;
					var item_num=0;
					$("#dg_body").empty();
					var strVar = "";
					var level_things=[];
					/*
						0 : one/two/three/four/five
						1 : border color|stars color
						2 : fake border image url
					*/
					var special_face={};//咕哒子化的从者使用强化一卡牌作为图鉴face
					//find函数
					special_face.find=function(el){
						var bool=false;
						for(_in in special_face)
						{
							if(_in==el)
							{
								bool=true;
								return bool;
							}
						}
						return bool;
					}
					var face_img=[];//对应的card图片路径
					for(var i in Myservent_dg)
					{
						switch(Myservent_dg[i]["level"])
						{
							case '1':level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=("servent"=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case '2':level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=("servent"=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case '3':level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=("servent"=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
							break;
							case '4':level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=("servent"=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case '5':level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=("servent"=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case 1:level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=("servent"=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case 2:level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=("servent"=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case 3:level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=("servent"=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
							break;
							case 4:level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=("servent"=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case 5:level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=("servent"=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
						}
						if(special_face.find(Myservent_dg[i]["itemid"]))
						{
							face_img.push("servent"+"_"+level_things[0]+"_"+Myservent_dg[i]["itemid"]+"_strength1.jpg");
						}
						else{
							if(parseInt(Myservent_dg[i]['exp'])<=20 || parseInt(Myservent_dg[i]["strength"])==0)
							face_img.push("servent"+"_"+level_things[0]+"_"+Myservent_dg[i]["itemid"]+".jpg");
							else {
								var real_card_num=parseInt(parseInt(Myservent_dg[i]['exp'])/20)>parseInt(Myservent_dg[i]['strength'])?parseInt(Myservent_dg[i]['strength']):parseInt(parseInt(Myservent_dg[i]['exp'])/20);
								face_img.push("servent"+"_"+level_things[0]+"_"+Myservent_dg[i]["itemid"]+"_strength"+real_card_num+".jpg");
							}
						}
						if("servent"=='servent')servent_num++;
						//if("servent"=='item')item_num++;
						strVar += "<div class=\"dg_item mouse-hand"+(Myservent_dg[i]["check"]=="no"?"":"dg_item_select")+"\" id=\"dg_item"+Myservent_dg[i]["id"]+"\" style=\"background:url('style/images/card/"+face_img[i]+"');background-position:60% 10%;background-repeat:no-repeat;border:2px "+level_things[1]+" solid;border-bottom:0px #000 solid;\">\n";
						// if(Myservent_dg[i]['type']=='servent')
				    	strVar += "	<div class=\"dg_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:1px 1px 1px #222;'>\n";
						// else
						// 	strVar += "	<div class=\"dg_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:1px 1px 1px #222;background-color:#ddd;'>\n";
						var name="";
						name=(Myservent_dg[i]["name"].length<=6?Myservent_dg[i]["name"]:(Myservent_dg[i]["name"].indexOf("·")>-1?(Myservent_dg[i]["name"].substr(0,Myservent_dg[i]["name"].indexOf("·"))):(Myservent_dg[i]["name"].indexOf("(")>-1?(Myservent_dg[i]["name"].substr(0,Myservent_dg[i]["name"].indexOf("("))):Myservent_dg[i]["name"])));
						strVar += "<span style=\"color:"+level_things[1]+";font-size:0.5em;\">"+"★★★★★".slice(0,Myservent_dg[i]["level"])+"<\/span>"+"<br/>"+name+"<br/><span class='dg_servent_lv'>LV:"+Myservent_dg[i]['exp']+"</span>\n";
						strVar += "	<\/div>\n";
						strVar += "	<div class=\"dg_item_bottom_img\" style=\"background: url(\'style/images/"+level_things[2]+"\');\">\n";
						//console.log(level_things[2]);

						strVar += "	<\/div>\n";
						strVar += "<\/div>\n";
					}
					$("#dg_num_servent").text(servent_num);
					$("#dg_num_item").text("~");
					$("#dg_body").append(strVar);
					//绑定点击事件，点击选择派遣去打工
					$("#dg_cont").val()==''?$("#dg_cont").val('0'):false;
					for (var i in Myservent_dg)
					{
						var id="#dg_item"+Myservent_dg[i]["id"];
						var img="url(style/images/card/"+face_img[i]+") no-repeat 50% 25%";
						(function(id,imgurl,select){
						$(id).click(function(event) {
							if($(this).val()=='')
							{
								if(Myservent_dg[select]["check"]=="no")
								$(this).val('0');
								else{
									$(this).val('1');
								}
							}
							if(parseInt($(this).val(),10)==0 && parseInt($("#dg_cont").val(),10)<parseInt($("#dg_cont").attr("max-block"),10))
							{
								//再次渲染组件的时候仍会保持这个从者的选择
								Myservent_dg[select]["check"]="yes";
								$(this).val('1');//表示选中这个材料
								//选中强化素材，框变化，数量加一
								var num=parseInt($("#dg_cont").val(),10);
								//console.log("选择从者,已选择数量:"+num);
								$("#dg_servent"+String(num+1)).css("background",imgurl);
								//设置文字信息
								var name=(Myservent_dg[select]["name"].length<=6?Myservent_dg[select]["name"]:(Myservent_dg[select]["name"].indexOf("·")>-1?(Myservent_dg[select]["name"].substr(0,Myservent_dg[select]["name"].indexOf("·"))):(Myservent_dg[select]["name"].indexOf("(")>-1?(Myservent_dg[select]["name"].substr(0,Myservent_dg[select]["name"].indexOf("("))):Myservent_dg[select]["name"])));
								$("#dg_servent_text"+String(num+1)).css("height","70px");
								$("#dg_servent_text"+String(num+1)).html(name+"已准备!<span style='display:block'>"+emoji[rn(0,emoji.length-1)]+"</span>");
								//记录id用于去除
								$("#dg_servent"+String(num+1)).attr("data-item-id",id);
								$("#dg_cont").val(num+1);
								if((num+1)==parseInt($("#dg_cont").attr("max-block"),10)){
									$("#dg2").hide();
									$("#dg_check").hide();
									$("#dg_post").show();
									$("#dg_cont").show();
									$("#dg_bottom_btn").show();
								}
								$(this).addClass('dg_item_select');
							}
							else if(parseInt($(this).val(),10)==1)
							{
								//再次渲染组件的时候不会保持这个素材的选择
								Myservent_dg[select]["check"]="no";
								$(this).val('0');//表示取消这个材料
								//选中强化素材，框变化，数量加一
								var num=parseInt($("#dg_cont").val(),10);
								//console.log("取消从者,已选择数量:"+num);
								var shift=false;
								var shiftel=null;
								$(".dg_box").each(function(index, el) {
									if($(el).attr("data-item-id")==id)
									{
										$(el).attr("data-item-id","0");
										$(el).css("background","");
										$(el).find(".dg_servent_text").text('');
										$(el).find(".dg_servent_text").css("height","0px");
										shift=true;//需要把后一个移到前一个去
										shiftel=el;
									}else{
										if(shift&&shiftel!=null)
										{
											if($(el).find(".dg_servent_text").text().length>0)
											{
													$(shiftel).css("background",$(el).css('background'));
													$(shiftel).attr("data-item-id",$(el).attr("data-item-id"));
													$(shiftel).find(".dg_servent_text").css("height","70px");
													$(shiftel).find(".dg_servent_text").text($(el).find(".dg_servent_text").text());
													shiftel=el;
													$(el).css("background","");
													$(el).find(".dg_servent_text").css("height","0");
													$(el).find(".dg_servent_text").text("");
											}
											else{
												shiftel=null;
												shift=false;
											}
										}
									}
								});
								$("#dg_cont").val(num-1);
								$(this).removeClass('dg_item_select');
							}
						});
					})(id,img,i);
					}
				}
			},
			qh_append_item_data:function(){
				fgoThis=this;
				if(Myitem_qh.length>=0)
				{
					//根据后台图鉴数据生成图鉴列表
					var servent_num=0;
					var item_num=0;
					$("#qh_body").empty();
					var strVar = "";
					var level_things=[];
					/*
						0 : one/two/three/four/five
						1 : border color|stars color
						2 : fake border image url
					*/
					var special_face={};//咕哒子化的从者使用强化一卡牌作为图鉴face
					//find函数
					special_face.find=function(el){
						var bool=false;
						for(_in in special_face)
						{
							if(_in==el)
							{
								bool=true;
								return bool;
							}
						}
						return bool;
					}
					var face_img=[];//对应的card图片路径
					for(var i in Myitem_qh)
					{
						if(Myitem_qh[i]['id']==$("#qh_choose_card").val().substr($("#qh_choose_card").val().indexOf("m")+1,$("#qh_choose_card").val().length)){face_img.push("pass");continue;}
						//console.log(typeof Myitem[i]["level"]);
						switch(Myitem_qh[i]["level"])
						{
							case '1':level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem_qh[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case '2':level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem_qh[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case '3':level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=(Myitem_qh[i]["type"]=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
							break;
							case '4':level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=(Myitem_qh[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case '5':level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=(Myitem_qh[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case 1:level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem_qh[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case 2:level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=(Myitem_qh[i]["type"]=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case 3:level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=(Myitem_qh[i]["type"]=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
							break;
							case 4:level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=(Myitem_qh[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case 5:level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=(Myitem_qh[i]["type"]=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
						}
						if(special_face.find(Myitem_qh[i]["itemid"]))
						{
							face_img.push("item"+"_"+level_things[0]+"_"+Myitem_qh[i]["itemid"]+"_strength1.jpg");
						}
						else{
							if(Myitem_qh[i]["type"]=='item')
							face_img.push("item"+"_"+level_things[0]+"_"+Myitem_qh[i]["itemid"]+".jpg");
							else {
								face_img.push("servent"+"_"+level_things[0]+"_"+Myitem_qh[i]["itemid"]+".jpg");
							}
						}
						if(Myitem_qh[i]["type"]=='servent')servent_num++;
						if(Myitem_qh[i]["type"]=='item')item_num++;
						if(Myitem_qh[i]["type"]=='servent')
						strVar += "<div class=\"qh_item mouse-hand"+(Myitem_qh[i]["check"]=="no"?"":"qh_item_select")+"\" id=\"qh_item"+Myitem_qh[i]["id"]+"\" style=\"background:url('style/images/card/"+face_img[i]+"');background-position:60% 10%;background-repeat:no-repeat;border:2px "+level_things[1]+" solid;border-bottom:0px #000 solid;\">\n";
						if(Myitem_qh[i]["type"]=='item')
						strVar += "<div class=\"qh_item mouse-hand"+(Myitem_qh[i]["check"]=="no"?"":"qh_item_select")+"\" id=\"qh_item"+Myitem_qh[i]["id"]+"\" style=\"background:url('style/images/card/"+face_img[i]+"');background-position:50% 45%;background-repeat:no-repeat;border:2px "+level_things[1]+" solid;border-bottom:0px #000 solid;\">\n";
						// if(Myitem_qh[i]['type']=='servent')
				    // 	strVar += "	<div class=\"qh_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:1px 1px 1px #222;'>\n";
						// else
							strVar += "	<div class=\"qh_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:1px 1px 1px #222;background-color:#ddd;'>\n";
						var name="";
						name=(Myitem_qh[i]["name"].length<=6?Myitem_qh[i]["name"]:(Myitem_qh[i]["name"].indexOf("·")>-1?(Myitem_qh[i]["name"].substr(0,Myitem_qh[i]["name"].indexOf("·"))):(Myitem_qh[i]["name"].indexOf("(")>-1?(Myitem_qh[i]["name"].substr(0,Myitem_qh[i]["name"].indexOf("("))):Myitem_qh[i]["name"])));
						strVar += "<span style=\"color:"+level_things[1]+";font-size:0.5em;\">"+"★★★★★".slice(0,Myitem_qh[i]["level"])+"<\/span>"+"<br/>"+name+(Myitem_qh[i]["type"]=='servent'?"<br/>LV:0\n":"\n");
						strVar += "	<\/div>\n";
						strVar += "	<div class=\"qh_item_bottom_img\" style=\"background: url(\'style/images/"+level_things[2]+"\');\">\n";
						//console.log(level_things[2]);
						strVar += "	<\/div>\n";
						strVar += "<\/div>\n";
					}
					$("#qh_num_servent").text(servent_num);
					$("#qh_num_item").text(item_num);
					$("#qh_body").append(strVar);
					//绑定点击事件，选择素材$("#qh_choose_item").val()记录选择的数量
					$("#choose_item_ok").click(function(event) {
						//退出素材选择页面
						$("#qh2").hide();
						$("#qh_choose_card").show();
						//选从者页面的head打开
						$("#qh2_head").show();
						//关闭选物品页面的head
						$("#choose_item_head").hide();
					});
					$("#qh_choose_item").val()==''?$("#qh_choose_item").val('0'):false;
					for (var i in Myitem_qh)
					{
						if(Myitem_qh[i]['id']==$("#qh_choose_card").val().substr($("#qh_choose_card").val().indexOf("m")+1,$("#qh_choose_card").val().length)){face_img.push("pass");continue;}
						var id="#qh_item"+Myitem_qh[i]["id"];
						var img="url(style/images/card/"+face_img[i]+")";
						(function(id,imgurl,select){
						$(id).click(function(event) {
							if($(this).val()=='')
							{
								if(Myitem_qh[select]["check"]=="no")
								$(this).val('0');
								else{
									$(this).val('1');
								}
							}
							if(parseInt($(this).val(),10)==0 && parseInt($("#qh_choose_item").val(),10)<20)
							{
								//再次渲染组件的时候仍会保持这个素材的选择
								Myitem_qh[select]["check"]="yes";
								$(this).val('1');//表示选中这个材料
								//选中强化素材，框变化，数量加一
								var num=parseInt($("#qh_choose_item").val(),10);
								$("#qh_littleitem"+String(num+1)).css("background-image",imgurl);
								if(imgurl.indexOf('servent')>=0)
								{
									$("#qh_littleitem"+String(num+1)).css("background-position","50% 10%");
								}
								if(imgurl.indexOf('item')>=0)
								{
									$("#qh_littleitem"+String(num+1)).css("background-position","50% 45%");
								}
								//记录id用于去除
								$("#qh_littleitem"+String(num+1)).attr("data-item-id",id);
								$("#qh_choose_item").val(num+1);
								if((num+1)==20){
									$("#qh2").hide();
									$("#qh_choose_card").show();
									//选从者页面的head打开
									$("#qh2_head").show();
									//关闭选物品页面的head
									$("#choose_item_head").hide();
								}
								$(this).addClass('qh_item_select');
							}
							else if(parseInt($(this).val(),10)==1)
							{
								//再次渲染组件的时候不会保持这个素材的选择
								Myitem_qh[select]["check"]="no";
								$(this).val('0');//表示取消这个材料
								//选中强化素材，框变化，数量加一
								var num=parseInt($("#qh_choose_item").val(),10);
								var shift=false;
								var shiftel=null;
								$(".qh_item_box").each(function(index, el) {
									if($(el).attr("data-item-id")==id)
									{
										$(el).attr("data-item-id","0");
										$(el).css("background-image","");
										shift=true;//需要把后一个移到前一个去
										shiftel=el;
									}else{
										if(shift&&shiftel!=null)
										{
											$(shiftel).css("background-image",$(el).css('background-image'));
											$(shiftel).attr("data-item-id",$(el).attr("data-item-id"));
											shiftel=el;
										}
									}
								});
								$("#qh_choose_item").val(num-1);
								$(this).removeClass('qh_item_select');
							}
						});
					})(id,img,i);
					}
				}
			},
			qh_append_servent_data:function(){
				fgoThis=this;
				if(Myservent_qh.length>=0)
				{
					//根据后台图鉴数据生成图鉴列表
					var servent_num=0;
					var item_num=0;
					$("#qh_body").empty();
					var strVar = "";
					var level_things=[];
					/*
						0 : one/two/three/four/five
						1 : border color|stars color
						2 : fake border image url
					*/
					var special_face={};//咕哒子化的从者使用强化一卡牌作为图鉴face
					//find函数
					special_face.find=function(el){
						var bool=false;
						for(_in in special_face)
						{
							if(_in==el)
							{
								bool=true;
								return bool;
							}
						}
						return bool;
					}
					var face_img=[];//对应的card图片路径
					for(var i in Myservent_qh)
					{
						//console.log(typeof Myitem[i]["level"]);
						switch(Myservent_qh[i]["level"])
						{
							case '1':level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=("servent"=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case '2':level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=("servent"=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case '3':level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=("servent"=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
							break;
							case '4':level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=("servent"=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case '5':level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=("servent"=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case 1:level_things[0]="one";level_things[1]="rgb(128,112,87)";level_things[2]=("servent"=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case 2:level_things[0]="two";level_things[1]="rgb(128,112,87)";level_things[2]=("servent"=='servent')?"servent_bottom1.jpg":"item_bottom1.jpg";
							break;
							case 3:level_things[0]="three";level_things[1]="rgb(177,177,177)";level_things[2]=("servent"=='servent')?"servent_bottom2.jpg":"item_bottom2.jpg";
							break;
							case 4:level_things[0]="four";level_things[1]="#FFCC00";level_things[2]=("servent"=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
							case 5:level_things[0]="five";level_things[1]="#FFCC00";level_things[2]=("servent"=='servent')?"servent_bottom3.jpg":"item_bottom3.jpg";
							break;
						}
						if(special_face.find(Myservent_qh[i]["itemid"]))
						{
							face_img.push("servent"+"_"+level_things[0]+"_"+Myservent_qh[i]["itemid"]+"_strength1.jpg");
						}
						else{
							if(parseInt(Myservent_qh[i]['exp'])<=20 || parseInt(Myservent_qh[i]["strength"])==0)
							face_img.push("servent"+"_"+level_things[0]+"_"+Myservent_qh[i]["itemid"]+".jpg");
							else {
								var real_card_num=parseInt(parseInt(Myservent_qh[i]['exp'])/20)>parseInt(Myservent_qh[i]['strength'])?parseInt(Myservent_qh[i]['strength']):parseInt(parseInt(Myservent_qh[i]['exp'])/20);
								face_img.push("servent"+"_"+level_things[0]+"_"+Myservent_qh[i]["itemid"]+"_strength"+real_card_num+".jpg");
							}
						}
						if("servent"=='servent')servent_num++;
						//if("servent"=='item')item_num++;
						strVar += "<div class=\"qh_item\" id=\"qh_item"+Myservent_qh[i]["id"]+"\" style=\"background:url('style/images/card/"+face_img[i]+"');background-position:60% 10%;background-repeat:no-repeat;border:2px "+level_things[1]+" solid;border-bottom:0px #000 solid;\">\n";
						// if(Myservent_qh[i]['type']=='servent')
				    	strVar += "	<div class=\"qh_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:1px 1px 1px #222;'>\n";
						// else
						// 	strVar += "	<div class=\"qh_item_text text-noselect\" style='color:"+level_things[1]+";font-weight:7000;text-shadow:1px 1px 1px #222;background-color:#ddd;'>\n";
						var name="";
						name=(Myservent_qh[i]["name"].length<=6?Myservent_qh[i]["name"]:(Myservent_qh[i]["name"].indexOf("·")>-1?(Myservent_qh[i]["name"].substr(0,Myservent_qh[i]["name"].indexOf("·"))):(Myservent_qh[i]["name"].indexOf("(")>-1?(Myservent_qh[i]["name"].substr(0,Myservent_qh[i]["name"].indexOf("("))):Myservent_qh[i]["name"])));
						strVar += "<span style=\"color:"+level_things[1]+";font-size:0.5em;\">"+"★★★★★".slice(0,Myservent_qh[i]["level"])+"<\/span>"+"<br/>"+name+"<br/><span class='qh_servent_lv'>LV:"+Myservent_qh[i]['exp']+"</span>\n";
						strVar += "	<\/div>\n";
						strVar += "	<div class=\"qh_item_bottom_img\" style=\"background: url(\'style/images/"+level_things[2]+"\');\">\n";
						//console.log(level_things[2]);

						strVar += "	<\/div>\n";
						strVar += "<\/div>\n";
					}
					$("#qh_num_servent").text(servent_num);
					$("#qh_num_item").text("~");
					$("#qh_body").append(strVar);
					//绑定点击事件，查看大图
					for (var i in Myservent_qh)
					{
						var id="#qh_item"+Myservent_qh[i]["id"];
						var img="style/images/card/"+face_img[i];
						var real_level=Myservent_qh[i]['exp'];
						var all_exp=Myservent_qh[i]['allexp'];
						var level_up=parseInt(Myservent_qh[i]['strength'])==0?20:parseInt(Myservent_qh[i]['strength'])*20;
						(function(id,imgurl,real_level,level_up,all_exp){
						$(id).click(function(event) {
							//选中强化目标 退回qh初始界面
							$("#qh_choose_card").css("background-image","url('"+imgurl+"')");
							$("#qh2").hide();
							$("#qh_choose_card").show();
							$("#qh_choose_card").val(id);
							$("#qh_choose_item").css("background-image","url('style/images/qh_choose_item.jpg')");
							fgoThis.qh_exp_width(all_exp,real_level);
							$("#qh_level").html(real_level);
							$("#qh_level_all").html(level_up);
						});
					})(id,img,real_level,level_up,all_exp);
					}
				}
			},
			colorful_egg:function(){
				fgoThis=this;
				//有概率all_bgm变成鬼畜
				var p=rn(1,100);
				if(p>=1 && p<=10 && $("#login").css('display')=='none')
				{
					console.log("彩蛋BGM播放(手动滑稽)")
					fgoThis.control_bgm("egg_bgm",1);
					setTimeout(function(){
						fgoThis.control_bgm("egg_bgm",0);
						console.log("关闭彩蛋BGM");
					},247000);
				}
			},
			starmouse:function(){
					jQuery('.fgo').jstars({
						image_path: 'style/images',
						style: 'yellow',
						frequency: 30,
						delay:500,
					});
		  },
			notification:function(){
				fgoThis=this;
				//初始化显示msg的容器
				var msg_show=$("#fgo_msg");
				Notify.init(msg_show);
				//更新该用户的msgList
				//fgoThis.get_msg();
			}
	}
		fgo.init();
		//前端随机数 测试使用
		function rn(minNum,maxNum){
		 switch(arguments.length){
		 case 1:
			return parseInt(Math.random()*minNum+1);
		 break;
		 case 2:
			return parseInt(Math.random()*(maxNum-minNum+1)+minNum);
		 break;
		 default:
			return 0;
		 break;
		 }
		}
		//经验计算函数
		function level_exp($x){
			//当前等级升一级所需经验|x级到x+1级所需经验
			return Math.ceil(1.88*$x*$x*$x-51.7*$x*$x+535.7*$x+187);
		}
		function allexp_from_zero_level($x){
			//从零到x级所需要的所有经验
			var $e=0;
			for (var $i=0; $i <$x; $i++) {
				$e+=level_exp($i);
			}
			return $e;
		}
		function exp_level($exp)
		{
			//给总exp，返回等级
		  $exp=parseInt($exp,10);
		  var $x=0;
		  while($exp>level_exp($x))
		  {
		    $exp=$exp-level_exp($x);
		    $x++;
		  }
		  return $x;
		}
		function mine_percent($x,$rare)
		{
		  //根据英灵稀有度返回挖矿效率
		  switch(parseInt($rare,10))
		  {
		    case 1:
		    return logistic($x,0.8,0.1,0.01);
		    break;
		    case 2:
		    return logistic($x,0.8,0.1,0.015);
		    break;
		    case 3:
		    return logistic($x,0.8,0.1,0.02);
		    break;
		    case 4:
		    return logistic($x,0.8,0.1,0.03);
		    break;
		    case 5:
		    return logistic($x,0.8,0.1,0.05);
		    break;
		  }
		}
		function logistic($x,$k,$r,$p0)
		{
		  //logistic函数,给定不同的K,r,P0参数和X的值，返回y的值
			if($x>1000)
			{
				$x=exp_level($x);
				//console.log($x);
			}
			//console.log("level:",$x)
		  return ($k*$p0)/($p0+($k-$p0)*(Math.pow(2.71828,(-1*$r*$x))));
		}
		function price_dg_block($i){
		  //$i是当前拥有的块
		  //返回买下一个块需要多少钱
		  return Math.pow(2,$i-2)*300;
		}
	});
	function page_control(nowid){
		console.log(nowid);
		$(".page").each(function(index, el) {
			var k=$(el).attr('class');
			if(k.indexOf("active")>0)
			{
				$(el).attr("class",k.replace(/active/,""));
				$(el).css("display","none");
				//解锁跳转按钮
				var id="#"+$(el).attr("id")+"_page";
				$(id).each(function(index, el) {
					//console.log(el)
					$(el).attr("disabled",false);
				});
			}
		});
		//禁用当前打开页面的跳转按钮
		//console.dir($("#"+nowid+"_page"))
		$("#"+nowid+"_page").each(function(index, el) {
			$(el).attr("disabled","true");
		});
		//打开当前页面
		$("#"+nowid).addClass('active');
		$("#"+nowid).css("display","block");
		//console.log($("#"+nowid));
	}
	function msg_click_empty()
	{}
	function dg_msg_click(){
		page_control("dg");
	}
