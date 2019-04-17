import fetch from "node-fetch";
import { Routes } from "./routes";

class Client {
  constructor(sessionDate, courseName) {
    this.sessionDate = sessionDate;
    this.courseName = courseName;
    this.token = null;
    this.courseId = null;
    this.enrollmentId = null
    this.attendanceList = null;
    this.myself = null;
    this.sessionsList = null;
    this.currentSession = null;
    this.missingStudentList = null;
  }

  async login() {
    const response = await fetch(Routes.login, {
      method: "POST",
      body: JSON.stringify({
        email: process.env.EMAIL,
        password: process.env.PASSWORD
      })
    });
    const data = await response.json();
    this.token = data.authenticationInfo.authToken;
    this.myself = await this.me()
  }

  async attendancePoll() {
    this.courseName ? this.findCourse() : this.getLatestCourse()
    await this.fetchSessions()
    await this.fetchAttendance()
    const dateParams = this.sessionDate ? {date: this.sessionDate} : {}
    this.findSession(dateParams)
    return this.missingAttendants()
  }

  async me() {
    const response = await fetch(Routes.me, {
      method: "POST",
      headers: { authToken: this.token }
    });
    return response.json();
  }

  async findCourse() {
    let enrollment = this.myself.enrollments.find(item => item.course.name === this.courseName)
    this.courseId = Number(enrollment.courseId);
    this.enrollmentId = Number(enrollment.id);
    return enrollment
  }

  async getLatestCourse() {
    let list = this.myself.enrollments
    let currentEnrollment = list[list.length-1]
    this.courseId = Number(currentEnrollment.courseId);
    this.enrollmentId = Number(currentEnrollment.id);
    return currentEnrollment
  }

  async fetchSessions() {
    const response = await fetch(Routes.sessions, {
      method: 'POST',
      headers: { authToken: this.token },
      body: JSON.stringify({ enrollmentId: this.enrollmentId})
    })
    const data = await response.json();
    this.sessionsList = data.currentWeekSessions
    return this.sessionsList
  }

  findSession(options={}) {
    let currentSession = this.sessionsList.find(item => {
      let currentTime = options.date ? new Date(options.date) : new Date()
      currentTime = currentTime.getTime() / 1000
      const startTime = new Date(item.session.startTime).getTime() / 1000
      const endTime = new Date(item.session.endTime).getTime() / 1000
      return currentTime >= startTime && currentTime <= endTime
    })
    this.currentSession = currentSession
    return this.currentSession
  }

  missingAttendants() {
    this.missingStudentList = this.attendanceList.filter(item => {
      const isSession = this.currentSession.session.name === item.sessionName
      return isSession && !item.present
    })
  }

  async fetchAttendance() {
    const response = await fetch(Routes.attendance, {
      method: "POST",
      headers: { authToken: this.token },
      body: JSON.stringify({ courseId: this.courseId })
    });
    const data = await response.json();
    this.attendanceList = data;
    return this.attendanceList;
  }
}

export { Client }