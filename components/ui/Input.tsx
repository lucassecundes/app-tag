import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '../../constants/Colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = ({ label, error, icon, style, ...props }: InputProps) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? { paddingLeft: 40 } : null, style]}
          placeholderTextColor={Colors.textMuted}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Montserrat_500Medium',
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    height: 50,
    color: Colors.text,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  iconContainer: {
    position: 'absolute',
    left: 12,
    top: 13,
    zIndex: 1,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },
});
