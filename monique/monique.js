module.exports = function(RED) {

  "use strict";
  const crypto = require('crypto-extra');
  const msgpack = require('msgpack5')();
  const encode = msgpack.encode;
  const decode = msgpack.decode;

  function ToMoniqueNode(n) {
    // Create a RED node
    RED.nodes.createNode(this, n);

    // Store local copies of the node configuration (as defined in the .html)
    this.type = n.mqtype || 'data';
    this.spec = n.mqspec;
    this.logs = n.mqlogs;
    this.metrica = n.mqmetrica;
    this.creator = n.mqcreator;
    this.encoding = (n.mqencoding === 'json') ? 'JSON' : 'MessagePack';

    let count = 0;
    //const toBin = e => Buffer.from(e);
    const toBin = e => RED.util.ensureBuffer(e);

    const node = this;

    if (this.creator !== '' || this.spec !== '') {
      // respond to inputs....
      this.on('input', (msg) => {
        const timestart = Date.now();
        let data;
        let log = {};

        const { payload } = msg;
        const created_at = Date.now();

        try {

          if (this.encoding === 'JSON') {
            data = toBin(JSON.stringify(payload || ''));
          } else if (this.encoding === 'MessagePack') {
            data = encode(payload || '');
          } else {
            throw new Error('101');
          }

          const id = crypto.randomString(40);
          const pid = msg.mqpid || '';
          const expires_at = msg.mqexpiresat || 0;

          const message = {
            id,
            pid,
            data,
            expires_at,
            created_at,
            spec: node.spec,
            type: node.type,
            creator: node.creator,
            encoding: node.encoding
          };

          const tag = `${node.type}:${node.spec}:${id}:${pid}:${node.creator}`;

          msg.topic = tag;
          msg.payload = encode(message);

          log = null;

        } catch (err) {
          node.status({ fill: "red", shape: "dot", text: `error / ${(Date.now() - timestart)} ms` });
          node.error(err, msg);
          msg = null;
          log = {
            topic: 'MoniQue node error',
            payload: err.message
          };
        }
        if (this.metrica && msg) {
          count += 1;
          msg.count = count;
          node.status({ fill: "green", shape: "dot", text: `${count} / ${(Date.now() - timestart)} ms` });
        }
        node.send([msg, log]);
      });

      this.on("close", () => {
        node.status({});
      });
    } else {
      this.error(RED._(" Missing node configuration"));
    }
  }

  // Register the node by name. This must be called before overriding any of the
  // Node functions.
  RED.nodes.registerType("to monique", ToMoniqueNode);

  function FromMoniqueNode(n) {
    // Create a RED node
    RED.nodes.createNode(this, n);

    // Store local copies of the node configuration (as defined in the .html)
    this.logs = n.mqlogs;
    this.metrica = n.mqmetrica;

    let count = 0;
    let log = {};

    const types = {
      data: 'data',
      error: 'error',
      config: 'config',
      result: 'result'
    };

    const protocol = {
      id: id => typeof id === 'string',
      pid: pid => typeof pid === 'string',
      type: type => typeof type === 'string',
      spec: spec => typeof spec === 'string',
      creator: creator => typeof creator === 'string',
      encoding: encoding => typeof encoding === 'string',
      expires_at: expires_at => typeof expires_at === 'number',
      created_at: created_at => typeof created_at === 'number',
      data: data => Buffer.isBuffer(data)
    };

    const validate = message => {
      let valid = true;
      if (this.logs) log.payload.error = {};
      for (let key in protocol) {
        if (!message.hasOwnProperty(key) || !protocol[key](message[key])) {
          valid = false;
          if (this.logs) log.payload.error[key] = false;
        }
      }
      return valid;
    };

    const checkType = type => type in types;

    const node = this;

    this.on('input', (msg) => {
      if (this.logs) {
        log = {};
        log.payload = {
          timestamp: new Date().toLocaleString()
        }
      };

      node.status({});

      const timestart = Date.now();

      try {

        const tag = RED.util.ensureString(msg.topic);

        if (tag.split(':').length != 5) {
          throw new Error('201');
        }

        const [type] = tag.split(':');

        if (!checkType(type)) {
          throw new Error('201');
        }

          const message = decode(RED.util.ensureBuffer(msg.payload));

          if (!validate(message)) {
            throw new Error('101');
          }

          if (message.encoding === 'JSON') {
            message.data = JSON.parse(message.data.toString());
          } else if (message.encoding === 'MessagePack') {
            message.data = decode(message.data);
          } else {
            throw new Error('101');
          }

          message.id = RED.util.ensureString(message.id);
          message.pid = RED.util.ensureString(message.pid);

          msg.topic = tag;
          msg.payload = message;

          log = null;

      } catch (err) {
        node.status({ fill: "red", shape: "dot", text: `error / ${(Date.now() - timestart)} ms` });
        node.error(err, msg);
        msg = null;
        if (this.logs) {
          log.topic = 'MoniQue node error';
          log.payload.code = err.message;
          log.payload.node = 'MoniQue In';
        } else {
          log = null;
        }
      }
      if (this.metrica && msg) {
        count += 1;
        msg.count = count;
        node.status({ fill: "green", shape: "dot", text: `${count} / ${(Date.now() - timestart)} ms` });
      }

      node.send([msg, log]);
    });

    this.on("close", () => {
      node.status({});
    });
  }

  // Register the node by name. This must be called before overriding any of the
  // Node functions.
  RED.nodes.registerType("from monique", FromMoniqueNode);

}