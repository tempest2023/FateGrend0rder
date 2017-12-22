<?php
header("Content-type: text/html; charset=utf-8");
if ($_POST['inf']=='dg')
{
  //开始打工任务
  post_mine();
}
if ($_POST['inf']=='get')
{
  //查询用户有多少钱
  get_num();
}
if($_POST['inf']=='time')
{
  //查询从者工作了多长时间
  get_time();
}
if($_POST['inf']=='get_servent')
{
  //查询可以打工的从者
  get_servent();
}
if($_POST['inf']=='get_working_servent')
{
  get_working_servent();
}
if($_POST['inf']=='get_dg_time')
{
  set_dg_time();
}
if($_POST['inf']=='buy_dg_block')
{
  buy_dg_block();
}
if($_POST['inf']=='get_dg_block')
{
  get_dg_block();
}
function get_dg_block(){
  require("include/global.php");
  mysql_query("SET NAMES UTF8");
  mysql_query("set character_set_client=utf8");
  mysql_query("set character_set_results=utf8");
  $user=$_POST['user'];
  $sql = "select * from user where user='$user';";
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
    $id=$rows['id'];
    $k++;
  }
  if($k==1){
    $sql="select dg_block from user where id=$id;";
    $rs = mysql_query($sql,$link);
    $dg_block=2;
    while($rows=mysql_fetch_assoc($rs)){
      $dg_block=$rows['dg_block'];
    }
    if($rs)
    {
      echo $dg_block;
    }else{
      echo "查询错误";
    }
  }
  else{
      echo "用户登录异常";
  }
}
function buy_dg_block(){
  require("include/global.php");
  mysql_query("SET NAMES UTF8");
  mysql_query("set character_set_client=utf8");
  mysql_query("set character_set_results=utf8");
  $user=$_POST['user'];
  $sql = "select * from user where user='$user';";
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
    $id=$rows['id'];
    $k++;
  }
  if($k==1){
    $sql="select blocknum,dg_block from user where id=$id;";
    //echo $sql."\n";
    $rs = mysql_query($sql,$link);
    $dg_block=2;
    $blocknum=0;
    while($rows=mysql_fetch_assoc($rs)){
      $blocknum=$rows['blocknum'];
      $dg_block=$rows['dg_block'];
    }
    if($blocknum>price_dg_block($dg_block))
    {
      $blocknum=intval($blocknum-price_dg_block($dg_block));
      $dg_block=intval($dg_block+1);
      //购买
      $sql="UPDATE `user` SET `blocknum`=$blocknum,`dg_block`=$dg_block WHERE id=$id;";
      //echo $sql."\n";
      $rs = mysql_query($sql,$link);
      if($rs)
      {
        echo true;
      }else{
        echo false;
      }
    }else{
      echo "余额不足";
    }
  }
  else{
      echo "用户登录异常";
  }
}
function set_dg_time(){
  require("include/global.php");
  mysql_query("SET NAMES UTF8");
  mysql_query("set character_set_client=utf8");
  mysql_query("set character_set_results=utf8");
  $user=$_POST['user'];
  $sql = "select * from user where user='$user';";
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
    $id=$rows['id'];
    $k++;
  }
  if($k==1){
    $sql="select * from myitem where userid=$id and work=1;";
    $rs=mysql_query($sql,$link);
    //$test="";
    while($rows=mysql_fetch_assoc($rs)){
      $worktime=intval($rows['beginwork']);
      //$test=$test.$worktime."   ".(time()-15*60)."   ";
      $time=intval(time()-15*60);
      if($time-$worktime>0)
      {
        //打工完毕,改变状态
        $sql="UPDATE `myitem` SET `work`=0,`beginwork`='' WHERE id=".$rows['id'].";";
        //echo $sql;
        $result=mysql_query($sql,$link);
      }
    }
    $sql="select count(id) from myitem where userid=$id and work=1;";
    $rs=mysql_query($sql,$link);
    $cou=mysql_fetch_assoc($rs);
    if($cou["count(id)"]==0)
    {
      //再次上线已经全部打工完毕,结算钱
      $sql="SELECT blocknum FROM `user` WHERE user='$user';";
      $rs = mysql_query($sql,$link);
      $num=0;
      while($rows=mysql_fetch_assoc($rs)){
        $num=$rows['blocknum'];
      }
      // echo "  Mymoney: ".$num."\n";
      $sql="select tmp_num from user where user = '$user';";
      $rs=mysql_query($sql,$link);
      $tmp_num=0;
      while($rows=mysql_fetch_assoc($rs)){
        $tmp_num=$rows['tmp_num'];
      }
      // echo "  Earn: ".$tmp_num."\n";
      $num=intval($num)+intval($tmp_num);
      // echo "  All: ".$num."\n";
      $sql="UPDATE `user` SET `blocknum`=$num,tmp_num=0 WHERE user='$user';";
      $rs=mysql_query($sql,$link);
      if($rs)
      {
        echo true;
      }else{
        echo false;
      }
    }
    //echo $test;
    echo true;
  }
  else{
    echo "用户登录异常";
  }
}
function get_working_servent(){
  require("include/global.php");
  mysql_query("SET NAMES UTF8");
  mysql_query("set character_set_client=utf8");
  mysql_query("set character_set_results=utf8");
  $user=$_POST['user'];
  $sql = "select * from user where user='$user';";
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
    $id=$rows['id'];
    $k++;
  }
  if($k==1){
      $sql="select myitem.beginwork as beginwork,myitem.id as myitemid,myitem.itemid as id,myitem.exp as exp,tj.strength as strength,tj.level as level,tj.name as name from myitem INNER JOIN tj on tj.id=myitem.itemid where myitem.userid=$id and myitem.work=1 order by exp;";
      // echo $sql;
      $rs = mysql_query($sql,$link);
      //echo $sql;
      //返回打工从者的id和开始时间戳
      $i=0;
      while($rows=mysql_fetch_assoc($rs)){
        $re["id".$i]=$rows["id"];
        $re["beginwork".$i]=$rows["beginwork"];
        $re["exp".$i]=$rows['exp'];
        $re["level".$i]=$rows['level'];
        $re["name".$i]=$rows['name'];
        $re["strength".$i]=$rows['strength'];
        $re["myitemid".$i]=$rows['myitemid'];
        $i++;
      }
      $re["length"]=$i;
      if($rs)
      {
        echo json_encode($re);
      }else{
        echo false;
      }
  }
  else{
    echo "用户登录异常";
  }
}
function get_servent(){
	    require("include/global.php");
      mysql_query("SET NAMES UTF8");
      mysql_query("set character_set_client=utf8");
      mysql_query("set character_set_results=utf8");
      $un=$_POST['user'];
      $sql = "Select id from user where user='$un';";
      $rs=mysql_query($sql,$link);

      if(mysql_num_rows($rs)>=1)
			{
        $id=0;
      	while($rows=mysql_fetch_assoc($rs))
      	{
          $id=$rows['id'];
        }
              $sql="SELECT myitem.id as id,myitem.itemid as itemid,myitem.exp as exp,myitem.date as date,myitem.work as work, tj.name as name, tj.level as level, tj.strength as strength, tj.class as class FROM `myitem` INNER JOIN tj ON (myitem.itemid = tj.id) where myitem.userid=$id and myitem.work=0 and myitem.sold=0 and tj.type='servent' and myitem.exp>0 order by exp+0 desc;";
        			$rs=mysql_query($sql,$link);
        			if(mysql_num_rows($rs)>=1)
        			{
                $i=0;
              	while($rows=mysql_fetch_assoc($rs))
              	{
                    $result['name'.$i]=$rows['name'];
                		$result['level'.$i]=$rows['level'];
                		$result['strength'.$i]=$rows['strength'];
                    $result['class'.$i]=$rows['class'];
              		  $result['id'.$i]=$rows['id'];//MyitemId
                    $result['work'.$i]=$rows['work'];
                    //exp换算等级
                    $result['exp'.$i]=exp_level((float)$rows['exp']);
                    $result['allexp'.$i]=$rows['exp'];
                    $result['date'.$i]=$rows['date'];
                    $result['itemid'.$i]=$rows['itemid'];//Myitem 里的itmeid即图鉴id
              		$i++;
              		}
              	$result['length']=$i;
                echo json_encode($result);
              }else{echo "false";}
      }
      else{echo "false";}

	}
function get_time(){
  require("include/global.php");
  mysql_query("SET NAMES UTF8");
  mysql_query("set character_set_client=utf8");
  mysql_query("set character_set_results=utf8");
  $user=$_POST['user'];
  $servent_id=$_POST['servent_id'];
  $sql = "select * from user where user='$user';";
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
    $id=$rows['id'];
    $k++;
  }
  if($k==1){
    //把字符串数组转成数组
    $k=strpos($servent_id,"[",0);
    $servent_id=substr($servent_id,$k+1,strlen($servent_id));
    $k=strrpos($servent_id,"]",0);
    $servent_id=substr($servent_id,0,$k);
    $servent_id=explode(",",$servent_id);
    //string转int
    for ($i=0; $i < count($servent_id); $i++) {
      $servent_id[$i]=substr($servent_id[$i],1,strlen($servent_id)-1);
    }
    $result=array();
    for ($i=0; $i < count($servent_id); $i++) {
        //返回从者打工开始时间戳
        $sql="select myitem.work as work,myitem.beginwork as beginwork,tj.name as name,tj.level as level,myitem.exp as exp from myitem INNER JOIN tj on tj.id=myitem.itemid where myitem.id=".$servent_id[$i].";";
        $rs = mysql_query($sql,$link);
        while($rows=mysql_fetch_assoc($rs)){
          if(intval($rows["work"])==1)
          {
            $result['beginwork'.$i]=$rows['beginwork'];
          }else{
            //返回16分钟前的时间戳
            $result['beginwork'.$i]=intval(time()-16*60*60);
          }
          $result['name'.$i]=$rows['name'];
          $result['level'.$i]=$rows['level'];
          $result['exp'.$i]=$rows['exp'];
          $result['id'.$i]=$servent_id[$i];
        }
      $result['length']=$i+1;
    }
    echo json_encode($result);
  }
  else{
    echo "用户登录异常";
  }
}
function post_mine(){
  require("include/global.php");
  $user=$_POST['user'];
  $servent_id=$_POST['servent_id'];
  $sql = "select * from user where user='$user';";
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
    $id=$rows['id'];
    $k++;
  }
  if($k==1){
    $rebool=true;
    //把字符串数组转成数组
    $k=strpos($servent_id,"[",0);
    $servent_id=substr($servent_id,$k+1,strlen($servent_id));
    $k=strrpos($servent_id,"]",0);
    $servent_id=substr($servent_id,0,$k);
    $servent_id=explode(",",$servent_id);
    //string转int
    for ($i=0; $i < count($servent_id); $i++) {
      $servent_id[$i]=substr($servent_id[$i],1,strlen($servent_id)-1);
    }
    //标识该从者为work状态并且记录打工开始时间
    for ($i=0; $i < count($servent_id); $i++) {
      $time=intval(time());
      $sql="update myitem set work=1,beginwork='$time' where id=$servent_id[$i];";
      $rs = mysql_query($sql,$link);
    }
    if(!$rs)
    {
      $rebool=false;
    }
    //返回true的结果，php继续执行下面的一些东西
    // echo gettype($servent_id)."\n";
    // echo $servent_id[0]." ".$servent_id[1]." ".$servent_id[2]." ";
    echo $rebool;//返回结果给ajax
    // get the size of the output
    $size = ob_get_length();
    // 发送header来告诉浏览器关闭连接!!!!
    header("Content-Length: $size");
    header('Connection: close');
    ob_end_flush();
    ob_flush();
    flush();

    /******** background process starts here ********/
    ignore_user_abort(true);//在关闭连接后，继续运行php脚本
    /******** background process ********/
    set_time_limit(0); //no time limit，不设置超时时间（根据实际情况使用）
    //继续运行的代码
    $output=0;
    for ($i=0; $i < count($servent_id); $i++) {
        //获取servent的exp和level来计算打工效率
        $sql="select myitem.exp as exp, tj.level as level from myitem INNER JOIN tj on tj.id=myitem.itemid where myitem.userid=$id and myitem.id=$servent_id[$i];";
        $rs = mysql_query($sql,$link);
        $level=1;$exp=0;
        while($rows=mysql_fetch_assoc($rs)){
          $exp=exp_level($rows['exp']);
          $level=$rows['level'];
        }
        //计算挖矿效率
        $p=mine_percent($exp,$level);
        //暂时的处理方式
        //$output=$output+$p*100+rand(-3,3);
        $output=intval($output)+intval($p*100);
        //向服务器发送data，挖矿
        // $ch = curl_init();
        // $timeout = 10000;
        // curl_setopt ($ch, CURLOPT_URL, 'http://120.78.76.249/dg?username='.$user."&p=".$p);
        // curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
        // curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
        // $output = curl_exec($ch);
        // curl_close($ch);
        //查询玩家的money
    }
    $sql="SELECT tmp_num FROM `user` WHERE user='$user';";
    $rs = mysql_query($sql,$link);
    if(!$rs)
    {
      $rebool=false;
    }
    $num=0;$num2=0;
    while($rows=mysql_fetch_assoc($rs)){
      $num2=$rows['tmp_num'];
    }
    //打工，把打工将要得到的钱全部存在tmp_num里
    $num=intval($output)+intval($num2);
    $sql="UPDATE `user` SET `tmp_num`=$num WHERE id=$id;";
    $rs=mysql_query($sql,$link);
    //延时0.25小时之后给用户钱,并且把改从者标识为unwork,清除从者工作时间.
    //sleep(30);
    sleep(900);
    $sql="SELECT blocknum FROM `user` WHERE user='$user';";
    $rs = mysql_query($sql,$link);
    $num=0;
    while($rows=mysql_fetch_assoc($rs)){
      $num=$rows['blocknum'];
    }
    $sql="select tmp_num from user where user = '$user';";
    $rs=mysql_query($sql,$link);
    $tmp_num=0;
    while($rows=mysql_fetch_assoc($rs)){
      $tmp_num=$rows['tmp_num'];
    }
    $num=intval($num)+intval($tmp_num);
    $sql="UPDATE `user` SET `blocknum`=$num,tmp_num=0 WHERE user='$user';";
    $rs=mysql_query($sql,$link);
    for ($i=0; $i < count($servent_id); $i++) {
      $sql="UPDATE myitem set work=0,beginwork='' where id=$servent_id[$i];";
      $rs=mysql_query($sql,$link);
    }
  }else{
    echo "用户登录异常";
  }
}
function get_num(){
  require("include/global.php");
  $user=$_POST['user'];
  $sql = "select * from user where user='$user';";
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
    $id=$rows['id'];
    $k++;
  }
  if($k==1){
    $sql="select blocknum from user where user='$user';";
    $rs=mysql_query($sql,$link);
    $re=0;
    while($rows=mysql_fetch_assoc($rs)){
      $re=$rows["blocknum"];
    }
    if($rs)
    {
        echo $re;
    }else{
      echo false;
    }
  }else{
    echo "用户登录异常";
  }
}
function get_chain(){
  require("include/global.php");
  $user=$_POST['user'];
  $sql = "select * from user where user='$user';";
  $result = mysql_query($sql,$link);
  $k=0;$id=0;
  while($rows=mysql_fetch_assoc($result)){
    $id=$rows['id'];
    $k++;
  }
  if($k==1){
    //发送data
    $ch = curl_init();
    $timeout = 10;
    curl_setopt ($ch, CURLOPT_URL, 'http://120.78.76.249/chain');
    curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
    $output = curl_exec($ch);
    curl_close($ch);
    echo gettype($output);
    echo $output."\n";
    $result=json_decode($output);
  }else{
    echo "用户登录异常";
  }
}
function mine_percent($x,$rare)
{
  //根据英灵稀有度返回挖矿效率
  switch(intval($rare))
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
  if(intval($x)>1000)
  {
    $x=exp_level($x);
  }
  return ($k*$p0)/($p0+($k-$p0)*(pow(2.71828,(-1*$r*$x))));
}
function level_exp($x){
  //当前等级升一级所需经验|x级到x+1级所需经验
  return ceil(1.88*pow($x,3)-51.7*pow($x,2)+535.7*$x+187);
}
function allexp_from_zero_level($x){
  //从零到x级所需要的所有经验
  $e=0;
  for ($i=0; $i <$x; $i++) {
    $e+=level_exp($i);
  }
  return $e;
}
function exp_level($exp){
  $exp=intval($exp);
  //给总exp，返回等级
  $x=0;
  while($exp>level_exp($x))
  {
    $exp=$exp-level_exp($x);
    $x++;
  }
  return $x;
}
function price_dg_block($i){
  //$i是当前拥有的块
  //返回买下一个块需要多少钱
  return pow(2,$i-2)*300;
}
?>
