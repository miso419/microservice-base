module.exports = (req, res) => {
    res.send(`${req.app.get('name')} Ver. ${req.app.get('version')}`);
};
