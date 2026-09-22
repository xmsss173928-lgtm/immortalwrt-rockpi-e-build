'use strict';
'require view';
'require form';
'require rpc';
'require poll';
'require ui';
'require dom';

var callStatus = rpc.declare({ object: 'luci.campusauth', method: 'status', expect: {} });
var callLogs = rpc.declare({ object: 'luci.campusauth', method: 'logs', expect: {} });

function callAction(method) {
	return rpc.declare({ object: 'luci.campusauth', method: method, expect: {} })();
}

function badge(ok, yes, no) {
	return E('span', {
		'class': ok ? 'label success' : 'label',
		'style': ok ? '' : 'background:#d9534f;color:#fff'
	}, ok ? yes : no);
}

function fmtSeconds(value) {
	var n = Number(value);
	if (!Number.isFinite(n) || n < 0 || n >= 4294967295)
		return '-';
	var d = Math.floor(n / 86400);
	var h = Math.floor(n % 86400 / 3600);
	var m = Math.floor(n % 3600 / 60);
	return (d ? d + '天 ' : '') + h + '小时 ' + m + '分钟';
}

return view.extend({
	load: function() {
		return Promise.all([ callStatus(), callLogs() ]);
	},

	runAction: function(method, title) {
		ui.showModal(title, [ E('p', { 'class': 'spinning' }, '正在执行，请稍候…') ]);
		return callAction(method).then(function() {
			ui.hideModal();
			return Promise.all([ callStatus(), callLogs() ]);
		}).then(this.update.bind(this)).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', String(err)), 'error');
		});
	},

	update: function(data) {
		var s = data[0] || {};
		var logs = (typeof data[1] === 'string') ? data[1] : ((data[1] || {}).logs || '');
		if (!document.getElementById('ca-auth'))
			return;
		dom.content(document.getElementById('ca-auth'), badge(!!s.authenticated, '已认证', '未认证'));
		dom.content(document.getElementById('ca-service'), badge(!!s.service_running, '运行中', '未运行'));
	dom.content(document.getElementById('ca-ua2f'), badge(!!s.ua2f_running, '运行中', '未运行'));
	dom.content(document.getElementById('ca-pause'), badge(!s.paused, '自动认证正常', '已暂停'));
	document.getElementById('ca-user').textContent = s.uid || '-';
	document.getElementById('ca-ip').textContent = s.ip || '-';
	document.getElementById('ca-time').textContent = s.login_time || '-';
	document.getElementById('ca-online').textContent = fmtSeconds(s.online_seconds);
	document.getElementById('ca-message').textContent = s.message || '-';
	document.getElementById('ca-logs').textContent = logs || '暂无日志';
	},

	render: function(data) {
		var self = this;
		var m = new form.Map('campusauth', '校园网认证',
			'适用于 Dr.COM Web Portal。注销会暂停本次开机的自动认证，点击“立即认证”即可恢复。');
		var s = m.section(form.NamedSection, 'main', 'campusauth', '基本设置');
		s.anonymous = true;
		var o = s.option(form.Flag, 'enabled', '启用自动认证');
		o.rmempty = false;
		o = s.option(form.Value, 'server', '认证服务器');
		o.placeholder = 'http://172.16.0.1';
		o.datatype = 'url';
		o.rmempty = false;
		o = s.option(form.Value, 'username', '校园网账号');
		o.rmempty = false;
		o = s.option(form.Value, 'password', '校园网密码');
		o.password = true;
		o.rmempty = false;
		o = s.option(form.Flag, 'auto_resume_boot', '重启后恢复自动认证');
		o.default = '1';
		o.rmempty = false;

		s = m.section(form.NamedSection, 'main', 'campusauth', '高级设置');
		s.anonymous = true;
		s.tab('timing', '检测与重试');
		s.tab('protocol', '协议参数');
		o = s.taboption('timing', form.Value, 'check_interval', '检测间隔（秒）');
		o.datatype = 'uinteger'; o.default = '5';
		o = s.taboption('timing', form.Value, 'timeout', '请求超时（秒）');
		o.datatype = 'uinteger'; o.default = '4';
		o = s.taboption('timing', form.Value, 'retry_initial', '首次重试（秒）');
		o.datatype = 'uinteger'; o.default = '5';
		o = s.taboption('timing', form.Value, 'retry_medium', '第二次重试（秒）');
		o.datatype = 'uinteger'; o.default = '15';
		o = s.taboption('timing', form.Value, 'retry_max', '后续重试（秒）');
		o.datatype = 'uinteger'; o.default = '30';
		[ ['r1','R1'], ['r3','R3'], ['r6','R6'], ['para','para'],
		  ['callback_status','状态回调名'], ['callback_login','登录回调名'],
		  ['callback_logout','注销回调名'], ['user_agent','User-Agent'] ].forEach(function(x) {
			o = s.taboption('protocol', form.Value, x[0], x[1]);
		});

		var status = E('div', { 'class': 'cbi-section' }, [
			E('h3', '实时状态'),
			E('div', { 'class': 'table' }, [
				E('div', { 'class': 'tr' }, [ E('div', { 'class':'td left', 'style':'width:25%' }, '校园网'), E('div', { 'class':'td left', id:'ca-auth' }) ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class':'td left' }, '监控服务'), E('div', { 'class':'td left', id:'ca-service' }) ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class':'td left' }, 'UA2F'), E('div', { 'class':'td left', id:'ca-ua2f' }) ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class':'td left' }, '自动认证'), E('div', { 'class':'td left', id:'ca-pause' }) ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class':'td left' }, '账号'), E('div', { 'class':'td left', id:'ca-user' }) ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class':'td left' }, '校园网 IP'), E('div', { 'class':'td left', id:'ca-ip' }) ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class':'td left' }, '登录时间'), E('div', { 'class':'td left', id:'ca-time' }) ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class':'td left' }, '在线时长'), E('div', { 'class':'td left', id:'ca-online' }) ]),
				E('div', { 'class': 'tr' }, [ E('div', { 'class':'td left' }, '状态信息'), E('div', { 'class':'td left', id:'ca-message' }) ])
			]),
			E('div', { 'class':'cbi-page-actions' }, [
				E('button', { 'class':'btn cbi-button-action', 'click':function(){ self.runAction('login','立即认证'); } }, '立即认证 / 恢复'),
				' ',
				E('button', { 'class':'btn cbi-button-negative', 'click':function(){ self.runAction('logout','注销校园网'); } }, '注销并暂停'),
				' ',
				E('button', { 'class':'btn', 'click':function(){ self.runAction('start','启动监控服务'); } }, '启动服务'),
				' ',
				E('button', { 'class':'btn', 'click':function(){ self.runAction('stop','停止监控服务'); } }, '停止服务'),
				' ',
				E('button', { 'class':'btn', 'click':function(){ self.runAction('restart','重启监控服务'); } }, '重启服务')
			])
		]);
		var logbox = E('div', { 'class':'cbi-section' }, [
			E('h3', '运行日志'),
			E('pre', { id:'ca-logs', 'style':'max-height:320px;overflow:auto;white-space:pre-wrap' })
		]);
		poll.add(function() {
			return Promise.all([ callStatus(), callLogs() ]).then(self.update.bind(self));
		}, 5);
		return m.render().then(function(node) {
			window.setTimeout(function() { self.update(data); }, 0);
			return E([], [ status, node, logbox ]);
		});
	},

	handleSaveApply: function(ev, mode) {
		return this.super('handleSaveApply', [ev, mode]).then(function() {
			return callAction('restart');
		});
	}
});
