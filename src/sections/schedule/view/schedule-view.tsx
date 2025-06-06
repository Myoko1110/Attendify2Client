import type { Dayjs } from 'dayjs';
import type { EventClickArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';

import dayjs from 'dayjs';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import jaLocale from '@fullcalendar/core/locales/ja';
import interactionPlugin from '@fullcalendar/interaction';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { defaultTimezone } from 'src/utils/format-time';

import Schedule from 'src/api/schedule';
import { APIError } from 'src/abc/api-error';
import { DashboardContent } from 'src/layouts/dashboard';

import { ScheduleAddDialog } from '../schedule-add-dialog';
import { ScheduleEditDialog } from '../schedule-edit-dialog';

// ----------------------------------------------------------------------

export function ScheduleView() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDate, setAddDate] = useState<Dayjs>();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule>();

  const handleDateClick = (e: DateClickArg) => {
    let isExists = false;
    const date = dayjs(e.date).tz();

    schedules.forEach((i) => {
      if (date.isSame(i.date, "day")) {
        setEditSchedule(i);
        setEditDialogOpen(true);
        isExists = true;
      }
    });
    if (!isExists) {
      setAddDate(dayjs(e.date));
      setAddDialogOpen(true);
    }
  };

  const handleEventClick = (e: EventClickArg) => {
    const eventDate = dayjs(e.event.start).tz();

    const s = schedules.find((i) => i.date.isSame(eventDate, "day"));
    setEditSchedule(s);
    setEditDialogOpen(true);
  };

  const reload = async () => {
    try {
      const result = await Schedule.get();
      setSchedules(result);
    } catch (e) {
      toast.error(APIError.createToastMessage(e));
    }

  };

  useEffect(() => {
    reload();
  }, []);

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          予定
        </Typography>
      </Box>

      <Card sx={{ height: "fit-content" }}>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locales={[jaLocale]}
            locale="ja"
            timeZone={defaultTimezone}
            headerToolbar={{
              left: 'prev,title,next',
              center: '',
              right: 'today',
            }}
            dayCellContent={(arg) => arg.date.getDate()}
            events={schedules.map((schedule) => ({
              start: schedule.date.format(),
              title: schedule.type.displayName,
              color: schedule.type.color,
              textColor: schedule.type.textColor,
              allDay: true,
              extendedProps: {
                type: schedule.type,
              },
            }))}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            contentHeight="auto"
          />

      </Card>
      <ScheduleAddDialog
        open={addDialogOpen}
        setOpen={setAddDialogOpen}
        date={addDate}
        setSchedules={setSchedules}
      />
      <ScheduleEditDialog
        open={editDialogOpen}
        setOpen={setEditDialogOpen}
        schedule={editSchedule}
        setSchedules={setSchedules}
      />
    </DashboardContent>
  );
}
