const cheerio = require("cheerio")
const request = require("../request/data")
const { attendances: testAttendanceData } = require("../util/testData")
const {
  getRequestToken,
  matchTermName,
  splitMainName,
} = require("../util/util")

// 获取考勤列表
const getList = async (ctx, next) => {
  if (ctx.request.headers.isTest) {
    ctx.result = testAttendanceData
    return next()
  }
  const cookie = getRequestToken(ctx)
  const content = await request.getAttendanceApi(cookie)
  const $ = cheerio.load(content)
  const attendances = []
  let attendanceItem = Object.assign({})
  const indexRef = [
    "name",
    "teacher",
    "classroom",
    "week",
    "section",
    "date",
    "reason",
    "mark",
  ]
  const tables = $("table")
  tables.each((tableIndex, table) => {
    const trDom = $(table).find("tbody tr")
    if (trDom.length == 1) {
      if (tableIndex > 0) {
        attendances.push(attendanceItem)
      }
      const txt = $(trDom[0]).children("td").slice(0).text()
      attendanceItem = Object.assign({
        termName: matchTermName(txt),
        attendanceList: [],
      })
      return
    }
    let attendance = {}
    trDom.slice(1).each((trIndex, tr) => {
      const tds = $(tr).find("td")
      tds.each((tdIndex, td) => {
        const txt = $(td).text()
        attendance[indexRef[tdIndex]] = txt
        if (tdIndex == 1) {
          const [num, name] = splitMainName(txt)
          attendance["teacherNum"] = num
          attendance["teacher"] = name
        }
        if (tdIndex == 0 || tdIndex == tds.length - 1) {
          if (tdIndex > 0) {
            attendanceItem.attendanceList.push(attendance)
          }
          attendance = {}
        }
      })
    })
    if (tableIndex == tables.length - 1) {
      attendances.push(attendanceItem)
    }
  })
  ctx.result = attendances
  return next()
}

module.exports = {
  getList,
}
