var express = require('express');
var app = express();
var mysql = require('mysql');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var bodyParser = require('body-parser');

var hostname = '127.0.0.1';
var port = 3003;

var client = mysql.createConnection({
    user: 'nodeuser',
    password: 'nodetest',
    database: 'SBSJ'
});

app.use(session({
  secret: 'asdf3234sdf@#%^@sdfa234ws3s3',
  resave: true,
  saveUninitialized: true,
  store: new MySQLStore({
    host: 'localhost',
    port: 3306,
    user: 'nodeuser',
    password: 'nodetest',
    database: 'sbsj'
  })
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.bodyParser());

app.get('/count', function(req, res){
   if(req.session.count) {
     req.session.count++;
   } else {
     req.session.count = 1;
  }
  res.send('count : '+req.session.count);
});

// 디비 연결 확인
client.connect(function(err) {
    if(!err) {
        console.log("디비 연결!");
    } else {
        console.log("디비 연결 안됨!");
    }
});

app.get('/login2.html',function(req,res){
    // 비어있음
});

// sign_up.html
// 회원 가입 정보를 디비에 전송
// 데이터베이스 SBSJ의 SpecInfo테이블에 저장
app.post('/UserInfo', function (request, response) {
    // 변수 선언
    var UserID = request.param('ID');
    var UserPW = request.param('password');
    var UserName = request.param('name');
    var PhoneNo = request.param('phone');

    // 데이터베이스 요청
    client.query('INSERT INTO UserInfo values(?,?,?,?)', [
        UserID, UserPW, UserName, PhoneNo
    ],function(err, data) {
    });

    response.redirect('/login2.html');
});

// login2.html
// 로그인하고 로그인 상태 유지
app.post('/login2.html',function(req,res) {
  var uname = req.param("username");
  var pwd = req.param("password");


  client.query('SELECT * from UserInfo', function(err, rows, fields) {
    var displayName='';
    if (!err){
      var data={};
      var data2={};
      var index=0;

      for(var i in rows){
        data[i] =rows[i].UserID;
        data2[i] = rows[i].UserPW;
        displayName = rows[i].UserID;
        index++;

        if(uname === data[i] && pwd ===data2[i]){
             req.session.displayName = displayName;
             req.session.save(()=>{
               res.redirect('/welcome');
            });

            break;
        }
      }
      if(uname !== rows[index-1].UserID && pwd !== rows[index-1].UserPW){
          req.session.save(()=>{
          res.redirect('/start.html');
       });
      }
    }
  })
});

// 이미 데이터베이스에 SpecInfo 정보가 있는 경우 
// specinfo.html 말고 main.html으로 전송
app.get('/welcome', function(req, res){
    var UserID = req.session.displayName;
    var data='';
    var index = 0;
    
    client.query('SELECT * from specinfo WHERE UserID =? ',[
    UserID
  ],function(err, rows, fields) {
     if(!err) {
       if(req.session.id) {
         req.session.save(()=>{
             for(i in rows){
                 data = rows[i].userID;
                 index++;
                 
                 if(data!='') {
                    res.redirect('/main.html');
                    break;
                 }
             }
             if(data=='') {
                 res.redirect('/spec_info.html');
             }
         })
       } else {
           res.redirect('/login2.html');
       }
     }
  });
});

// 유저의 회원가입 관련 정보 수정
app.post('/UserChange', function(request, response) {
    var UserID1 = request.session.displayName;
    // password name phone
    var Pw = request.param('password');
    var Nm = request.param('name');
    var Pn = request.param('phone');

    client.query('update userinfo set UserPW = ? ,UserName = ? ,PhoneNo = ?  where UserID = ? ', [
        Pw,Nm,Pn,UserID1
    ], function(err, data) {
        
    })
    
    response.redirect('/main.html');
})

// 유저의 사용자 관련 정보 수정 (SpecInfo에 저장되는 정보)
app.post('/CustomizeInfo', function(request, response) {
    var UserID1 = request.session.displayName;
    // password name phone
    var U_Grd = Number(request.param('grd'));
    var U_Eng = Number(request.param('eng'));

    // 라디오 버튼 값 숫자로 바꿔야 함
    var U_Jp = request.param('jp');
    var U_Cn = request.param('cn');
    var U_Com = request.param('com');
    var U_Hst = request.param('hst');
    var U_Acc = request.param('acc');

    // on과 off 0과 1로 변환
    if(U_Jp == 'on')
        U_Jp=1;
    else
        U_Jp=0;

    if(U_Cn == 'on')
        U_Cn=1;
    else
        U_Cn=0;

    if(U_Com == 'on')
        U_Com=1;
    else
        U_Com=0;

    if(U_Hst == 'on')
        U_Hst=1;
    else
        U_Hst=0;

    if(U_Acc == 'on')
        U_Acc=1;
    else
        U_Acc=0;

    var U_SalMin = Number(request.param('salmin'));
    var U_SalMax = Number(request.param('salmax'));

    client.query('update specinfo set U_Grd=?, U_Eng=?, U_Jp=?, U_Cn=?, U_Com=?, U_Hst=?, U_Acc=?, U_SalMin=?, U_SalMax=?  where UserID = ? ', [
      U_Grd, U_Eng, U_Jp, U_Cn, U_Com, U_Hst, U_Acc, U_SalMin, U_SalMax,UserID1
    ], function(err, data) {

    })

    response.redirect('/main.html');
})



// spec_info.html
// 유저의 입력 정보를 디비에 전송
// 데이터베이스 SBSJ의 SpecInfo테이블에 저장
app.post('/SpecInfo', function (request, response) {
    // 유저 아이디 받아와야 함
    // 임의로 위에서 선언했고 지금 디비에 임의의 유저 있음
    var UserID = request.session.displayName;

    // 변수 선언
    var U_Grd = Number(request.param('grd'));
    var U_Eng = Number(request.param('eng'));

    // 라디오 버튼 값 숫자로 바꿔야 함
    var U_Jp = request.param('jp');
    var U_Cn = request.param('cn');
    var U_Com = request.param('com');
    var U_Hst = request.param('hst');
    var U_Acc = request.param('acc');

    // on과 off 0과 1로 변환
    if(U_Jp == 'on')
        U_Jp=1;
    else
        U_Jp=0;

    if(U_Cn == 'on')
        U_Cn=1;
    else
        U_Cn=0;

    if(U_Com == 'on')
        U_Com=1;
    else
        U_Com=0;

    if(U_Hst == 'on')
        U_Hst=1;
    else
        U_Hst=0;

    if(U_Acc == 'on')
        U_Acc=1;
    else
        U_Acc=0;

    var U_SalMin = Number(request.param('salmin'));
    var U_SalMax = Number(request.param('salmax'));
    var U_Place = request.param('place');

    // 데이터베이스 요청 수행
    // 유저 입력 정보 SpecInfo 테이블에 입력
    client.query('INSERT INTO SpecInfo(UserID, U_Grd, U_Eng, U_Jp, U_Cn, U_Com, U_Hst, U_Acc, U_SalMin, U_SalMax) VALUES(?,?,?,?,?,?,?,?,?,?)', [
        UserID, U_Grd, U_Eng, U_Jp, U_Cn, U_Com, U_Hst, U_Acc, U_SalMin, U_SalMax
    ], function (error, data) {
    });

    // 기업 정보 저장을 위한 변수들
    var cno = {};
    var cgrd = {};
    var ceng = {};
    var cjp = {};
    var ccn = {};
    var ccom = {};
    var chst = {};
    var cacc = {};
    var csal = {};
    var length;

    // 기업의 정보 가져오기
    client.query('SELECT * FROM Company',function(err, row, field) {
        for(var i in row) {
            cno[i] = row[i].CompanyNo;
            cgrd[i] = row[i].C_Grd;
            ceng[i] = row[i].C_Eng;
            cjp[i] = row[i].C_Jp;
            ccn[i] = row[i].C_Cn;
            ccom[i] = row[i].C_Com;
            chst[i] = row[i].C_Hst;
            cacc[i] = row[i].C_Acc;
            csal[i] = row[i].C_Sal;

            // 학점, 영어 성적, 희망 연봉 비교
            if(U_Grd>=cgrd[i] && U_Eng>=ceng[i] && U_SalMax>=csal[i] && U_SalMin<=csal[i]){
                // 자격증 정보 비교
                if(cjp[i]==1&&U_Jp==0)
                    continue;
                if(ccn[i]==1&&U_Cn==0)
                    continue;
                if(ccom[i]==1&&U_Com==0)
                    continue;
                if(chst[i]==1&&U_Hst==0)
                    continue;
                if(cacc[i]==1&&U_Acc==0)
                    continue;

                // 조건에 맞는 데이터 삽입
                client.query('INSERT INTO Select_Co VALUES(?,?)',[
                UserID, cno[i]
                ],function(err, data) {
                });
            }
        }
    });
    response.redirect('/main.html');
});

// main.html
// 디비의 Select_Co 테이블에서
// 유저에게 맞는 기업정보를 받아오기
app.get('/main', function(request, response) {
    var UserID = request.session.displayName;

    // 데이터베이스 요청 수행
    // Select_Co와 Company 테이블을 이용하여
    // CompanyName 받아오기
    client.query('SELECT c.CompanyName FROM Company c, Select_Co s WHERE c.CompanyNo=s.CompanyNo and s.UserID=?',[
        UserID
    ], function(err, data) {
        response.send(data);
    })
});

// 좋아요 버튼 눌렀을 때
// UserUD와 CompanyNo를
// 데이터베이스의 LikeList 테이블에 저장
app.post('/Like', function(reqest, response) {
    var UserID = request.session.displayName;

    var comNo = request.param('comNo');

    client.query('INSERT INTO LikeList VALUES (?,?)', [
        UserID, comNo
    ], function(err, data) {

    })
})

// 로그아웃
app.get('/auth/logout', function(req, res) {

    delete req.session.displayName;
    req.session.save(()=>{
        res.redirect('/start.html');
    });
});


app.get('/start.html',function(req,res){
  var login = fs.readFileSync(__dirname + '/start.html','utf8');
  res.send(login);
});

// main.html 에서의 검색 기능 관련
app.get('/Search',function(request,response){
  var Search = request.param('search');

    // 검색을 위한 데이터베이스 요청 수행
    client.query('SELECT * from Company', function(err, rows, fields) {

      if (!err){
        var data={};
        var data1='';
        var context=0;
        for(var i in rows){
          data[i] =rows[i].CompanyKo;

          if(data[i].includes(Search)) {
            context = rows[i].CompanyNo;
            data1= rows[i].companyName;
              
              // 기업 검색에 따른 홈페이지 연결
              switch(context) {
                  case 1:   response.redirect('/com_info/nps/nps.html');
                            break;
                  case 2:   response.redirect('/com_info/jei/jei.html');
                            break;
                  case 3:   response.redirect('/com_info/kdb/kdb.html');
                            break;
                  case 4:   response.redirect('/com_info/nonghyup/nonghyup.html');
                            break;
                  case 5:   response.redirect('/com_info/pb/pb.html');
                            break;
                  case 6:   response.redirect('/com_info/nongsim/nongsim.html');
                            break;
                  case 7:   response.redirect('/com_info/nh/nh.html');
                            break;
                  case 8:   response.redirect('/com_info/daiso/daiso.html');
                            break;
                  case 9:   response.redirect('/com_info/line/line.html');
                            break;
                  case 10:   response.redirect('/com_info/lottegs/lottegs.html');
                            break;
                  case 11:   response.redirect('/com_info/bluebell/bluebell.html');
                            break;
                  case 12:   response.redirect('/com_info/bullsone/bullsone.html');
                            break;
                  case 13:   response.redirect('/com_info/burgerking/burgerking.html');
                            break;
                  case 14:   response.redirect('/com_info/bighit/bighit.html');
                            break;
                  case 15:   response.redirect('/com_info/sss/sss.html');
                            break;
                  case 16:   response.redirect('/com_info/ourhome/ourhome.html');
                            break;
                  case 17:   response.redirect('/com_info/ahngook/ahngook.html');
                            break;
                  case 18:   response.redirect('/com_info/orion/orion.html');
                            break;
                  case 19:   response.redirect('/com_info/baemin/baemin.html');
                            break;
                  case 20:   response.redirect('/com_info/with/with.html');
                            break;
                  case 21:   response.redirect('/com_info/wemap/wemap.html');
                           break;
                  case 22:   response.redirect('/com_info/emart/emart.html');
                           break;
                  case 23:   response.redirect('/com_info/iloom/iloom.html');
                           break;
                  case 24:   response.redirect('/com_info/jb/jb.html');
                           break;
                  case 25:   response.redirect('/com_info/sinsago/sinsago.html');
                           break;
                  case 26:   response.redirect('/com_info/giordano/giordano.html');
                           break;
                  case 27:   response.redirect('/com_info/coupang/coupang.html');
                          break;
                  case 28:   response.redirect('/com_info/kistemp/kistemp.html');
                          break;
                  case 29:   response.redirect('/com_info/with/with.html');
                          break;
                  case 30:   response.redirect('/com_info/flyand/flyand.html');
                          break;
                  case 31:   response.redirect('/com_info/with/with.html');
                          break;
                  case 32:   response.redirect('/com_info/water/water.html');
                          break;
                  case 33:   response.redirect('/com_info/hanssem/hanssem.html');
                          break;
                  case 34:   response.redirect('/com_info/ion/ion.html');
                         break;
                  case 35:   response.redirect('/com_info/hotelshila/hotelsilla.html');
                         break;
                  case 36:   response.redirect('/com_info/lh/lh.html');
                         break;
                  case 37:   response.redirect('/com_info/keco/keco.html');
                         break;
                  case 38:   response.redirect('/com_info/lgch/lgch.html');
                         break;
                  default:   response.redirect('main.html');
                         break;
                }
            break;
          }
        }
      }
    });
});

app.listen(3003, () => console.log('Server Running at' + hostname + ":" +port));
