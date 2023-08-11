import { useContext } from "react";
import { useStore } from "zustand";

import dayjs from "@calcom/dayjs";
import { classNames } from "@calcom/lib";
import type { DateRange } from "@calcom/lib/date-ranges";

import { DAY_CELL_WIDTH } from "../constants";
import { TBContext } from "../store";

interface TimeDialProps {
  timezone: string;
  dateRanges?: DateRange[];
}

function isMidnight(h: number) {
  return h <= 5 || h >= 22;
}

function isCurrentHourInRange({
  dateRanges,
  dateInfo,
}: {
  dateRanges?: DateRange[];
  dateInfo: {
    currentHour: number;
  };
}) {
  if (!dateRanges) return false;
  const { currentHour } = dateInfo;
  console.log({
    dateRanges,
  });

  return dateRanges.some((time) => {
    if (!time) null;

    const startHour = dayjs(time.start);
    const endHour = dayjs(time.end);

    // this is a weird way of doing this
    const newDate = dayjs(time.start).set("hour", currentHour);

    return newDate.isBetween(startHour, endHour, undefined, "[)"); // smiley faces or something
  });
}

export function TimeDial({ timezone, dateRanges }: TimeDialProps) {
  const store = useContext(TBContext);
  if (!store) throw new Error("Missing TBContext.Provider in the tree");
  const getTzInfo = useStore(store, (s) => s.getTimezone);
  const browsingDate = useStore(store, (s) => s.browsingDate);
  const tz = getTzInfo(timezone);

  if (!tz) return null;

  const { name, abbr } = tz; // TZ of the USER

  const usersTimezoneDate = dayjs(browsingDate).tz(name);

  const nowDate = dayjs(browsingDate);

  const offset = (nowDate.utcOffset() - usersTimezoneDate.utcOffset()) / 60;

  const hours = Array.from({ length: 24 }, (_, i) => i - offset + 1);

  const days = [
    hours.filter((i) => i < 0).map((i) => (i + 24) % 24),
    hours.filter((i) => i >= 0 && i < 24),
    hours.filter((i) => i >= 24).map((i) => i % 24),
  ];

  return (
    <>
      <div className="flex items-end overflow-auto text-sm">
        {days.map((day, i) => {
          if (!day.length) return null;
          const dateWithDaySet = usersTimezoneDate.add(i - 1, "day");
          return (
            <div key={i} className={classNames("flex flex-none overflow-hidden rounded-lg border border-2")}>
              {day.map((h) => {
                const hourSet = dateWithDaySet.set("hour", h).set("minute", 0);
                const currentHour = hourSet.hour();

                // const isInRange = false;
                const isInRange = isCurrentHourInRange({
                  dateRanges,
                  dateInfo: {
                    currentHour,
                  },
                });

                return (
                  <div
                    key={h}
                    className={classNames(
                      "flex h-8 flex-col items-center justify-center",
                      isInRange ? "text-emphasis bg-success" : "",
                      h ? "" : "bg-subtle font-medium"
                    )}
                    style={{
                      width: `${DAY_CELL_WIDTH}px`,
                    }}>
                    {h ? (
                      <div title={dateWithDaySet.format("DD/MM HH:mm")}>{h}</div>
                    ) : (
                      <div className="flex flex-col text-center text-xs leading-3">
                        <span>{dateWithDaySet.format("MMM")}</span>
                        <span>{dateWithDaySet.format("DD")}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}
