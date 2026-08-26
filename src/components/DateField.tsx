// src/components/DateField.tsx

import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, parse } from 'date-fns';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface Props {
  value?: Date;
  placeholder?: string;
  accessibilityLabel: string;
  onChange: (value: Date) => void;
}

const INPUT_FORMAT = 'yyyy-MM-dd';
// Keep entry inside a sane calendar range; a year-0001 start date is otherwise
// directly typeable in the browser date input.
const MIN_DATE = '1970-01-01';
const MAX_DATE = '2100-12-31';

// `format` throws RangeError on an Invalid Date, and this renders inside the
// tree, so never hand it one.
function isUsableDate(value?: Date): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

// `@react-native-community/datetimepicker` ships no web implementation — its
// fallback renders null, which leaves the browser build with a date field that
// cannot be edited. On web we fall back to a native `<input type="date">`.
export default function DateField({ value, placeholder, accessibilityLabel, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const safeValue = isUsableDate(value) ? value : undefined;

  if (Platform.OS === 'web') {
    return (
      <input
        type="date"
        aria-label={accessibilityLabel}
        min={MIN_DATE}
        max={MAX_DATE}
        value={safeValue ? format(safeValue, INPUT_FORMAT) : ''}
        onChange={(event) => {
          const raw = event.target.value;
          if (!raw) return;
          const parsed = parse(raw, INPUT_FORMAT, new Date());
          if (!Number.isNaN(parsed.getTime())) onChange(parsed);
        }}
        style={{
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: '#999',
          borderRadius: 4,
          padding: 12,
          marginBottom: 16,
          fontSize: 16,
          fontFamily: 'inherit',
        }}
      />
    );
  }

  const handleChange = (_: DateTimePickerEvent, selected?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selected) onChange(selected);
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
      >
        <Text>{safeValue ? safeValue.toDateString() : placeholder ?? 'Select a date'}</Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={safeValue ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
});
