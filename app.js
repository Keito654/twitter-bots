'use strict';
const Twitter = require('twitter');
const cron = require('cron').CronJob;

const client = new Twitter({
  consumer_key: process.env.TWITTER_API_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_API_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_API_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_API_ACCESS_TOKEN_SECRET
});

let checkedTweets = [];

function getHomeTimeLine() {
  client.get('statuses/home_timeline', {}, (error, tweets, response) => {
    if(error) console.log(error);
    
    //初回起動時は取得するだけで終了
    if(checkedTweets.length === 0){
      tweets.forEach( (homeTimeLineTweet, key) => {
        checkedTweets.push(homeTimeLineTweet); //配列に追加
      });

      return;
    }

    const newTweets = [];
    tweets.forEach((homeTimeLineTweet, key) => {
      if(isCheckedTweet(homeTimeLineTweet) === false) {
        responseHomeTimeLine(homeTimeLineTweet);
        newTweets.push(homeTimeLineTweet); //新しいツイートを追加
      }
    });

    //　調査済みリストに追加と、200個を超えていたら削除
    checkedTweets = newTweets.concat(checkedTweets); //配列の連結
    if(checkedTweets.length > 200) checkedTweets.length = 200; // 古い要素を削除して200個にする

  });
}

function isCheckedTweet(homeTimeLineTweet) {
      // ボット自身のツイートは無視する。
      if (homeTimeLineTweet.user.screen_name === 'maple10032_bot') {
          return true;
      }
  
      for (let checkedTweet of checkedTweets) {
          // 同内容を連続投稿をするアカウントがあるため、一度でも返信した内容は返信しない仕様にしています。
          if (checkedTweet.id_str === homeTimeLineTweet.id_str || checkedTweet.text === homeTimeLineTweet.text) {
              return true;
          }
      }
  
      return false;
  }
  
  
  const responses = ['面白い！', 'すごい！', 'なるほど！'];
  
  function responseHomeTimeLine(homeTimeLineTweet) {
      const tweetMessage = '@' + homeTimeLineTweet.user.screen_name + '「' + homeTimeLineTweet.text + '」 ' + responses[Math.floor(Math.random() * responses.length)];
      client.post('statuses/update', {
              status: tweetMessage,
              in_reply_to_status_id: homeTimeLineTweet.id_str
          })
          .then((tweet) => {
              console.log(tweet);
          })
          .catch((error) => {
              throw error;
          });
  }
  
  const cronJob = new cron({
  cronTime: '00 0-59/3 * * * *', // ３分ごとに実行
  start: true, // newした後即時実行するかどうか
  onTick: () => {
    //getHomeTimeLine();
  }
});
//getHomeTimeLine();




const replyTweet = ['返信ありがとう！', '仲良くしてね！', 'うれしみを感じる'];
const reraReplyTweet = '大好きです';

function replyRandom(){
  let daice = Math.random();
  
  if(daice < 0.05){
    return reraReplyTweet;
  } else {
    return replyTweet[Math.floor(Math.random() * replyTweet.length)];
  }
}


const stream = client.stream('statuses/filter', { track: '@maple10032_bot' });
stream.on('data', function(tweet) {
    console.log(tweet.text);

    const tweetMessage = '@' + tweet.user.screen_name + ' ' + replyRandom();
    client.post('statuses/update', {
            status: tweetMessage,
            in_reply_to_status_id: tweet.id_str
        })
        .then((tweet) => {
            console.log(tweet.text);
        })
        .catch((error) => {
            throw error;
        });
});

stream.on('error', function(error) {
    throw error;
});

//終了