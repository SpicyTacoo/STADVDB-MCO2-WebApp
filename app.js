import "dotenv/config";
import express from "express";
import hbs from "hbs";
import path from "path";
import {fileURLToPath} from 'url';
import cors from "cors";
import bodyParser from "body-parser";
import { pool, pool2, pool3 } from "./db/conn.js";
import { start } from "repl";

// to allow __dirname to work in ES6
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
app.use(express.json())
app.use(express.static(__dirname + '/public'));

app.set("view engine", "hbs")

hbs.registerPartials(path.join(__dirname, "views/partials"));


//starting hex code for ID
let initialId = 0


app.get("/", (req, res) => {
    res.redirect("/main");
});

app.get("/main", (req, res)=> {
    res.render("index")
})

app.get("/:port/make-appointment", (req, res)=> {
    res.render("createAppointment")
})

app.post("/:port/make-appointment", async (req, res)=> {
    const hexId = initialId.toString(16).padStart(32, '0')
    const curDate = new Date()

    const [numOfAppointmentId] = await pool.query(`SELECT COUNT(*) AS 'COUNT' FROM appointments`)

    const applicationId = numOfAppointmentId[0].COUNT.toString(16).padStart(32, '0')
    const patientId = hexId
    const clinicId = hexId
    const doctorId = hexId
    const status = "Queued"
    const timeQueued = curDate
    const queueDate = curDate
    const start_time = null 
    const end_time = null
    const type = req.body.appointmentType
    const isVirtual = req.body.virtual

    initialId += 1

    try {
        const result = await pool.query(`
        INSERT INTO appointments (appt_id, patient_id, clinic_id, doctor_id, status, time_queued, queue_date, start_time, end_time, type, isVirtual)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [applicationId, patientId, clinicId, doctorId, status, timeQueued, queueDate, start_time, end_time, type, isVirtual])

        console.log(result)
        res.status(200).send('Create Appointment Success');
    } catch(e) {
        console.error('Error Creating Appointment:', e);
        res.status(500).send('Error Creating Appointment');
    }
})

app.get("/:port/update-appointment", (req, res)=> {
    res.render("updateAppointment")
})

app.patch("/:port/update-appointment/:id", async (req, res)=> {
    const id = req.params.id
    const appointmentID = parseInt(id, 16).toString(16).padStart(32, '0')

    const clinicId = req.body.clinicId
    const doctorId = req.body.doctorId
    const status = req.body.status
    const start_time = req.body.startTime
    const end_time = req.body.endTime
    const type = req.body.appointmentType
    const isVirtual = req.body.virtual

    console.log(clinicId)
    console.log(doctorId)
    console.log(status)
    console.log(start_time)
    console.log(end_time)
    console.log(type)
    console.log(isVirtual)

    try {
        const result = await pool.query(`UPDATE appointments SET clinic_id = ?, doctor_id = ?, status = ?, start_time = ?, end_time = ?, type = ?, isVirtual = ? WHERE appt_id LIKE ?
                                        `, [clinicId, doctorId, status, start_time, end_time, type, isVirtual, appointmentID])
        
        console.log(result)
        res.status(200).send('Update Appointment Success');
    } catch(e) {
        console.error('Error Updating Appointment:', e);
        res.status(500).send('Error Updating Appointment');
    }
})

app.get("/:port/update-appointment/:id", async (req, res)=> {
    const id = req.params.id
    const appointmentID = parseInt(id, 16).toString(16).padStart(32, '0')
    console.log(appointmentID)

    try {
        const [appointmentData] = await pool.query(`SELECT * FROM appointments WHERE appt_id LIKE ?`, [appointmentID])

        console.log(appointmentData[0].doctor_id)
        
        console.log(appointmentData[0].start_time)
        console.log(appointmentData[0].end_time)
        const dataToRender = {
            appt_id: appointmentData[0].appt_id,
            doctor_id: appointmentData[0].doctor_id,
            clinic_id: appointmentData[0].clinic_id,
            status: appointmentData[0].status,
            start_time: appointmentData[0].start_time,
            end_time: appointmentData[0].end_time,
            type: appointmentData[0].type,
            isVirtual: appointmentData[0].isVirtual
        }

        res.render("updateAppointment", dataToRender)
    } catch(e) {
        console.error('Error searching appointments:', e);
        res.status(500).send('Error searching appointments');
    }
})

app.get("/:port/check-appointment", (req, res)=> {
    res.render("checkAppointment")
})


app.get("/:port/check", async (req, res)=>{
    const searchTerm = req.query.search;

    try{
        const [rows] = await pool.query("SELECT * FROM appointments WHERE appt_id LIKE ?", [`${searchTerm}`]);
        res.json(rows);
    }catch(error){
        console.error('Error searching appointments:', error);
        res.status(500).send('Error searching appointments');
    }
});

app.get("/:port/cancel-appointment", (req, res)=> {
    res.render("cancelAppointment")
})
app.get("/:port/search", async (req, res)=>{
    const searchTerm = req.query.search;

    try{
        const [rows] = await pool.query("SELECT * FROM appointments WHERE appt_id LIKE ?", [`${searchTerm}`]);
        res.json(rows);
    }catch(error){
        console.error('Error searching appointments:', error);
        res.status(500).send('Error searching appointments');
    }
});
app.post("/:port/delete", async (req, res)=>{
    var apptID = req.body.appointmentId;
    console.log("Delete Appointment ID: ", apptID);
    try {
        // Perform deletion logic here (e.g., execute SQL DELETE statement)
        await pool.query("DELETE FROM appointments WHERE appt_id = ?", [apptID]);

        res.sendStatus(200);
    } catch (error) {
        console.error("Error deleting appointment: ", error);
        res.status(500).send("Error deleting appointment");
    }
});
// connect to localhost
app.listen(3000, ()=> {
    console.log("Connected Successfully! Server is running on PORT: 3000");
});

// async function getAppointments() {
//     const [rows] = await pool.query("SELECT * FROM appointments")
//     return rows
// }

//const appointment = await getAppointments()
// console.log(appointment)