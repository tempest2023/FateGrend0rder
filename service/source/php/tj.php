<?php
if ($_POST['inf']=='get')
{get_tj();}
if($_POST['inf']=='add')
{
  add_tj();
}
function AttackFilter($StrKey,$StrValue,$ArrReq){
    if (is_array($StrValue)){
        $StrValue=implode($StrValue);
    }
    if (preg_match("/".$ArrReq."/is",$StrValue)==1){
        return false;
    }
		return true;
}
function add_tj()
{
  require("include/global.php");
	$data=$_POST['data'];
  mysql_query("SET NAMES UTF8");
  mysql_query("set character_set_client=utf8");
  mysql_query("set character_set_results=utf8");
  $rebool=true;
  $item=array();
  $k=strpos($data,"[",0);
  $data=substr($data,$k+1,strlen($data));
  $k=strrpos($data,"]",0);
  $data=substr($data,0,$k);
  while(strpos($data,"},{",0)>0)
  {
      $data=str_replace("},{","}&&&&&&&&&&{",$data);
    }
  $item=explode("&&&&&&&&&&",$data);
  foreach ($item as $key => $value) {
    $val=json_decode($value);
    $sql="INSERT INTO `tj` (`id`, `name`, `level`,`strength`,`type`, `class`) VALUES (";
    foreach ($val as $k => $v) {
      if($k=="id" ||$k=="level"||$k=="strength")
      $sql=$sql."".$v.",";
      else
      {
        if($k=="class")
          $sql=$sql."'".$v."'";
        else
          $sql=$sql."'".$v."',";
      }

    }
    $sql=$sql.");";
    // echo $sql."\n";
    $rs=mysql_query($sql,$link);
    if($rs==false){
      $rebool=false;
    }
  }
  echo $rebool;
}
function get_tj()
{
	    require("include/global.php");
      mysql_query("SET NAMES UTF8");
      mysql_query("set character_set_client=utf8");
      mysql_query("set character_set_results=utf8");
			$sql="SELECT * FROM `tj` order by level desc;";
			$rs=mysql_query($sql,$link);
			if(mysql_num_rows($rs)>=1)
			{
        $i=0;
      	while($rows=mysql_fetch_assoc($rs))
      	{

      		$result['id'.$i]=$rows['id'];
      		$result['name'.$i]=$rows['name'];
      		$result['level'.$i]=$rows['level'];
      		$result['type'.$i]=$rows['type'];
      		$result['strength'.$i]=$rows['strength'];
          $result['class'.$i]=$rows['class'];
      		$i++;
      		}
      	$result['length']=$i;
        echo json_encode($result);
				}
			else{echo "false";}

	}
?>
