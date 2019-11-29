const {Tracer, ConsoleRecorder} = require('zipkin')
const recorder = new ConsoleRecorder()

const CLSContext = require('zipkin-context-cls')
const ctxImpl = new CLSContext('zipkin')
const localServiceName = 'zipkin-koa-test'
const tracer = new Tracer({recorder, ctxImpl, localServiceName})

const Koa = require('koa')
const Router  = require('koa-router')
const {koaMiddleware} = require('zipkin-instrumentation-koa')

const axios = require('axios')
const wrapAxios = require('zipkin-instrumentation-axiosjs')
const remoteServiceName = 'zipkin-axios-access'
const zipkinAxios = wrapAxios(axios, { tracer, remoteServiceName})

const app = new Koa()
const router = new Router()

router.get('/', (ctx, next) => {
	ctx.body = 'hello world'
})
router.get('/axios', (ctx, next) => {
	return zipkinAxios.get('http://localhost:3000/axios2')
	.then( response => {
		ctx.body = response.data
	})
	.catch (error => {
		ctx.body = 'error'
	})
})
router.get('/axios2',  (ctx, next) => {
	ctx.body = 'axios access'
})
router.get('/test', (ctx, next) => {
	return zipkinAxios.get('http://localhost:3000/axios')
	.then( response => {
		ctx.body = response.data
	})
	.catch (error => {
		ctx.body = 'error'
	})
})

app.use(koaMiddleware({tracer}))

app.use(router.routes()).use(router.allowedMethods())

app.listen(3000)
