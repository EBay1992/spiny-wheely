import {
  Button,
  ButtonRow,
  FieldGroup,
  Label,
  Select,
} from './DashboardStyles';
import {
  METRICS_DATE_PRESETS,
  buildLocalDateValue,
  daysInMonth,
  formatDateRangeLabel,
  parseLocalDateValue,
  toLocalDateValue,
} from '../utils/date-range';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const YEAR_MIN = 2020;
const YEAR_MAX = new Date().getFullYear() + 1;

interface DateRangePickerProps {
  start: string;
  end: string;
  activePresetId: string | null;
  onChange: (range: { start: string; end: string }) => void;
  onPresetSelect: (presetId: string, range: { start: string; end: string }) => void;
}

function DateSelectors({
  idPrefix,
  label,
  value,
  onChange,
}: {
  idPrefix: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const { year, month, day } = parseLocalDateValue(value);
  const maxDay = daysInMonth(year, month);
  const years = Array.from(
    { length: YEAR_MAX - YEAR_MIN + 1 },
    (_, index) => YEAR_MAX - index,
  );

  const update = (patch: Partial<{ year: number; month: number; day: number }>) => {
    onChange(
      buildLocalDateValue(
        patch.year ?? year,
        patch.month ?? month,
        patch.day ?? day,
      ),
    );
  };

  return (
    <FieldGroup>
      <Label>{label}</Label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '0.5rem',
        }}
      >
        <div>
          <Label htmlFor={`${idPrefix}-day`} style={{ fontSize: '0.7rem' }}>
            Day
          </Label>
          <Select
            id={`${idPrefix}-day`}
            value={day}
            onChange={(e) => update({ day: Number(e.target.value) })}
          >
            {Array.from({ length: maxDay }, (_, index) => index + 1).map(
              (dayOption) => (
                <option key={dayOption} value={dayOption}>
                  {dayOption}
                </option>
              ),
            )}
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-month`} style={{ fontSize: '0.7rem' }}>
            Month
          </Label>
          <Select
            id={`${idPrefix}-month`}
            value={month}
            onChange={(e) => update({ month: Number(e.target.value) })}
          >
            {MONTHS.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-year`} style={{ fontSize: '0.7rem' }}>
            Year
          </Label>
          <Select
            id={`${idPrefix}-year`}
            value={year}
            onChange={(e) => update({ year: Number(e.target.value) })}
          >
            {years.map((yearOption) => (
              <option key={yearOption} value={yearOption}>
                {yearOption}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </FieldGroup>
  );
}

export function DateRangePicker({
  start,
  end,
  activePresetId,
  onChange,
  onPresetSelect,
}: DateRangePickerProps) {
  const handleStartChange = (nextStart: string) => {
    const nextEnd = nextStart > end ? nextStart : end;
    onChange({ start: nextStart, end: nextEnd });
  };

  const handleEndChange = (nextEnd: string) => {
    const nextStart = nextEnd < start ? nextEnd : start;
    onChange({ start: nextStart, end: nextEnd });
  };

  return (
    <div>
      <FieldGroup>
        <Label>Quick range</Label>
        <ButtonRow style={{ marginTop: 0 }}>
          {METRICS_DATE_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              $variant={activePresetId === preset.id ? 'primary' : 'ghost'}
              onClick={() => onPresetSelect(preset.id, preset.resolve())}
            >
              {preset.label}
            </Button>
          ))}
        </ButtonRow>
      </FieldGroup>

      <DateSelectors
        idPrefix="metrics-start"
        label="From"
        value={start}
        onChange={handleStartChange}
      />
      <DateSelectors
        idPrefix="metrics-end"
        label="To"
        value={end}
        onChange={handleEndChange}
      />

      <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 1rem' }}>
        Selected: <strong style={{ color: '#e2e8f0' }}>{formatDateRangeLabel(start, end)}</strong>
      </p>
    </div>
  );
}

export function defaultMetricsRange(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 29);
  return { start: toLocalDateValue(start), end: toLocalDateValue(end) };
}
