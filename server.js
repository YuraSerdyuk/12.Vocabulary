var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 5000;
var url = process.env.MONGODB_URI || 'mongodb://test:11111@cluster0-shard-00-00-pak5q.mongodb.net:27017,cluster0-shard-00-01-pak5q.mongodb.net:27017,cluster0-shard-00-02-pak5q.mongodb.net:27017/vocabulary?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin&retryWrites=true&w=majority'

var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoose = require('mongoose');

app.set('view engine', 'ejs');

mongoose.connect(url, { useNewUrlParser: true }, function(err) {
    if(err) throw err;
    console.log('Successfully connected!');
})

app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
    req.session.destroy();
    console.log(req.session);
    res.render('signIn')
})

app.post('/signIn', function (req, res) {
    var email_data = req.body.email_data;
    var password_data = req.body.password_data;

    try {
        var User = mongoose.model('User')
    } catch (error) {
        var User = mongoose.model('User', {
            login: String,
            password: String
        })
    }

    User.find({login: email_data, password: password_data}, function(err, docs) {
        if (docs != '') {

            req.session.username = ''
            req.session.username = email_data
            console.log(req.session.username);

            var result = {
                triger: true
            };
            res.send(result);

        } else {
            var result = {
                triger: false
            };
            res.send(result);
        }
    })
})

app.get('/registration', function (req, res) {
    res.render('registration')
})

app.post('/registration', function (req, res) {
    var email_data = req.body.email_data;
    var password_data = req.body.password_data;
    var repeat_password_data = req.body.repeat_password_data;

    try {
        var User = mongoose.model('User');
    } catch (error) {
        var User = mongoose.model('User', { 
            login: String,
            password: String });
    }

    User.find({login: email_data}, function(err, docs) {
        if(docs != '') {
            var myResponse = {
                warning: 'This account is busy',
                triger: false
            }
            res.send(JSON.stringify(myResponse))
        } else {

            var User_model = new User({ 
                login: email_data,
                password: password_data
            });
            
            User_model.save(function(err){
                if(err) return console.error(err);
                User.find({login: email_data}, function(err, docs) {
                    var username = docs[0].login
                    
                    try {
                        var Topic_model = mongoose.model('topic');
                    } catch (error) {
                        var Topic_model = mongoose.model('topic', {
                            username: String,
                            topic: String})
                    }
                    
                    var Topic = new Topic_model({
                        username: username,
                        topic: 'Other'
                    })
                    
                    Topic.save().then(() => console.log('Topic saved'));
                    
                    var myResponse = {
                        warning: '',
                        triger: true
                    }
                    res.send(JSON.stringify(myResponse))
                    });
                });
        }
    });
})

app.get('/home', function(req, res) {
    var username = req.session.username;
    if (username == undefined) {
        res.redirect('/')
    } else {     
        try {
            var Topic_model = mongoose.model('topic');
        } catch (error) {
            var Topic_model = mongoose.model('topic', {
                username: String,
                topic: String})
        }

        Topic_model.find({username: username}, function(err, docs) {
            var topic_data = docs;
            res.render('home', {
                topic_data: topic_data
            })
        });
    }
});

app.post('/home', function(req, res) {
    var word_data = req.body.word_data;
    var translation_data = req.body.translation_data;
    var choice_data = req.body.choice_data;
    var username = req.session.username;

    try {
        var Word_model = mongoose.model('Word');
    } catch (error) {
        var Word_model = mongoose.model('Word', {
            username: String,
            word: String,
            translation: String,
            topic: String,
            status: String})
    }

    var Word = new Word_model({
        username: username,
        word: word_data,
        translation: translation_data,
        topic: choice_data,
        status: ' '
    })

    Word.save().then(() => console.log('Word saved'));

    var myResponse = {
        warning: '',
        triger: true
    }
    res.send(JSON.stringify(myResponse))
});

app.post('/cr_topic', function(req, res) {
    var topic_data = req.body.topic_data;
    var username = req.session.username;

    try {
        var Topic = mongoose.model('topic')
    } catch (error) {
        var Topic = mongoose.model('topic', {
            username: String,
            topic: String})
    }

    var Topic = new Topic({
        username: username,
        topic: topic_data
    })

    Topic.save(function(err){
        if(err) return console.error(err);
        var myResponse = {
            warning: 'Topic saved'
        }
        res.send(myResponse)
    });
});

app.get('/wordsReview', function(req, res) {
    var username = req.session.username;

    if (username == undefined) {
        res.redirect('/')
    } else {
        try {
            var Topic_model = mongoose.model('topic');
        } catch (error) {
            var Topic_model = mongoose.model('topic', {
                username: String,
                topic: String})
        }

        Topic_model.find({username: username}, function(err, docs) {
            if (docs != '') {
                var topic_docs = docs
                console.log('User have topics: ' + topic_docs);

                try {
                    var Word_model = mongoose.model('Word');
                } catch (error) {
                    var Word_model = mongoose.model('Word', {
                        username: String,
                        word: String,
                        translation: String,
                        topic: String,
                        status: String})
                }

                Word_model.find({username: username}, function(err, docs) {
                    if (docs != '') {
                        var word_docs = docs

                        res.render('wordsReview', {
                            word_docs:  word_docs,
                            topic_docs: topic_docs
                        })
                    } else {
                        console.log('No words found');
                        res.render('wordsReview', {
                            word_docs:  false,
                            topic_docs: topic_docs
                        })
                    }
                });
            } else {
                console.log('No topics found');
                res.render('wordsReview', {
                    topic_docs: false
                })
            }
        });
    }
});

app.get('/choise', function(req, res) {
    var username = req.session.username;

    if (username == undefined) {
        res.redirect('/')
    } else {
        try {
            var Topic = mongoose.model('Topic')
        } catch (error) {
            var Topic = mongoose.model('Topic', {
                username: String,
                topic: String})
        }

        Topic.find({username: username}, function(err, docs) {
            if ( docs != '') {
                var topics_data = docs;
                
                res.render('choise', {
                    topics_data: topics_data
                })
            }
        })
    }
})

app.post('/choise', function(req, res) {
    var myResponse = {
        topic_data: req.body.topic_data,
        kind_data: req.body.kind_data,
        order_data: req.body.order_data
    }
    res.send(myResponse)
})

app.get('/study', function(req, res) {
    var full_name_topic = req.url.split(/(\/)/)[2]
    var name_topic = full_name_topic.split('?')[2]
    var username = req.session.username;

    if (username == undefined) {
        res.redirect('/')
    } else {
        
        try {
            var Word_model = mongoose.model('Word');
        } catch (error) {
            var Word_model = mongoose.model('Word', {
                username: String,
                word: String,
                translation: String,
                topic: String,
                status: String})
        }

        Word_model.find({username: username, topic: name_topic}, function(err, docs) {
            if (docs != '') {
                var word_docs = docs;
                res.render('study', {
                    word_docs: word_docs
                })
            } else {
                res.render('study', {
                    word_docs: ''
                })
            }
        })
    }
})

http.listen(port, function () {
  console.log('listening on: 5000 port');  
});
