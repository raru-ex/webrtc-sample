var express = require('express');
var router = express.Router();

/* POST room page. */
router.post('/', function(req, res, next) {
    res.render('room', {
          title: 'raru chat | ' + req.body.roomName,
          roomName: req.body.roomName,
          name: req.body.name
      });
});

module.exports = router;
