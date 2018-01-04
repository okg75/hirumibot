var restify = require('restify');
var builder = require('botbuilder');
var hirumiConst = require('./util/const.js');
var hirumiUtil = require('./util/function.js');

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('ヾ(⌒(ﾉ\'ω\')ﾉ');
});

var connector = new builder.ChatConnector({
    appId: 'APPID',
    appPassword: 'PASSWORD'
});

var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

bot.dialog('/', function (session) {
    try {

        var today = hirumiUtil.getToday();
        var text = session.message.text;
        var userName = session.message.user.name;

        // 今日日付のファイルがなければ作成する
        var listFilePath = hirumiConst.FILE_DIR + today + '.txt';
        if (!hirumiUtil.isExistFile(listFilePath)) {
            hirumiUtil.createFile(listFilePath, '');
        }

        /* 入力メッセージの判別 */
        // どちらでもない系
        var wordFilePath = hirumiConst.WORD_LIST_DIR + hirumiConst.WORD_LIST_FILE_UNKNOWN;
        var wasFound = hirumiUtil.findWord(text, wordFilePath);
        if (wasFound) {
            session.send('参加ですか？不参加ですか？');
            return;
        }

        // 不参加系
        wordFilePath = hirumiConst.WORD_LIST_DIR + hirumiConst.WORD_LIST_FILE_NON_PARTICIPATE;
        wasFound = hirumiUtil.findWord(text, wordFilePath);
        if (wasFound) {
            wasFound = hirumiUtil.findWord(userName, listFilePath);
            if (wasFound) {
                var userList = hirumiUtil.readFile(listFilePath);
                for (var i in userList) {
                    var memberName = userList[i];
                    if (memberName === '') {
                        continue;
                    }
                    if (memberName === userName) {
                        userList.splice(i, 1);
                        var userListStr = userList.join(hirumiConst.LINEFEED);
                        hirumiUtil.overwriteNameToFile(userListStr, listFilePath);
                        break;
                    }
                }
                session.send(userName + 'さんの参加を取り消したよ！また今度参加してね！');
            } else {
                session.send(userName + 'さんはまだ参加表明してないよ！');
            }
            return;
        }

        // 参加系
        wordFilePath = hirumiConst.WORD_LIST_DIR + hirumiConst.WORD_LIST_FILE_PARTICIPATE;
        wasFound = hirumiUtil.findWord(text, wordFilePath);
        if (wasFound) {
            var result = hirumiUtil.writeNameToFile(userName, listFilePath);
            if (result === hirumiConst.RESULT_CODE_SUCCESS) {
                session.send(userName + 'さんの参加を受け付けました！わーい！');
            } else if (result === hirumiConst.RESULT_CODE_UNNECESSARY) {
                session.send(userName + 'さんはすでに参加表明済みだよ！');
            }
            return;
        }

        // いま何人系
        wordFilePath = hirumiConst.WORD_LIST_DIR + hirumiConst.WORD_LIST_FILE_STATUS;
        wasFound = hirumiUtil.findWord(text, wordFilePath);
        if (wasFound) {
            members = hirumiUtil.readFile(listFilePath);
            memberList = [];
            for (var i in members) {
                memberName = members[i];
                if (memberName !== '') {
                    memberList.push(memberName);
                }
            }
            session.send('現在' + memberList.length + '人です！');
            session.send('参加予定メンバー：' + memberList.join(hirumiConst.DISPLAY_SEPARATOR));
            return;
        }

        // 行くぞ系
        wordFilePath = hirumiConst.WORD_LIST_DIR + hirumiConst.WORD_LIST_FILE_LETS_GO;
        wasFound = hirumiUtil.findWord(text, wordFilePath);
        if (wasFound) {
            members = hirumiUtil.readFile(listFilePath);
            memberList = [];
            for (var i in members) {
                memberName = members[i];
                if (memberName !== '') {
                    memberList.push(memberName);
                }
            }
            memberList = hirumiUtil.makeMembers(memberList);

            session.send('はーい！');
            session.send('メンバーはこちら！');
            for (var i in memberList) {
                session.send((parseInt(i) + 1) + '班：' + memberList[i].join(hirumiConst.DISPLAY_SEPARATOR));
            }
            return;
        }

        // リセット系
        wordFilePath = hirumiConst.WORD_LIST_DIR + hirumiConst.WORD_LIST_FILE_RESET;
        wasFound = hirumiUtil.findWord(text, wordFilePath);
        if (wasFound) {
            hirumiUtil.reset(listFilePath);
            session.send('リセットしたよ！');
            return;
        }

        session.send('＿/＼○_ﾋｬｯ　　ε=＼＿__○ノﾎｰｳ!!　←' + userName);

    } catch (e) {
        session.send('エラーです.しくしく:' + e);
    }
});