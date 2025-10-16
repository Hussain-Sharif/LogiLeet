// backend/src/middleware/validation.ts
import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

// Handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error:any) => error.msg);
    throw new ApiError(400, `Validation failed: ${errorMessages.join(', ')}`);
  }
  next();
};

// User registration validation
export const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian phone number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'driver', 'customer'])
    .withMessage('Role must be admin, driver, or customer'),
  
  body('licenseNumber')
    .if(body('role').equals('driver'))
    .notEmpty()
    .withMessage('License number is required for drivers'),
  
  body('licenseExpiry')
    .if(body('role').equals('driver'))
    .isISO8601()
    .withMessage('Valid license expiry date is required for drivers'),
  
  handleValidationErrors
];

// User login validation
export const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Vehicle validation
export const validateVehicle = [
  body('vehicleNumber')
    .matches(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/)
    .withMessage('Vehicle number format should be like KA01AB1234'),
  
  body('type')
    .isIn(['bike', 'car', 'truck', 'van'])
    .withMessage('Vehicle type must be bike, car, truck, or van'),
  
  body('vehicleBrand')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Vehicle brand is required and must be less than 30 characters'),
  
  body('vehicleModel')
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Vehicle model is required and must be less than 30 characters'),
  
  body('capacity.weight')
    .isNumeric()
    .isFloat({ min: 1, max: 50000 })
    .withMessage('Weight capacity must be between 1 and 50,000 kg'),
  
  body('capacity.volume')
    .isNumeric()
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('Volume capacity must be between 0.1 and 1,000 cubic meters'),
  
  body('registrationExpiry')
    .isISO8601()
    .isAfter()
    .withMessage('Registration expiry must be a future date'),
  
  body('insuranceExpiry')
    .isISO8601()
    .isAfter()
    .withMessage('Insurance expiry must be a future date'),
  
  handleValidationErrors
];

// Delivery validation
export const validateDelivery = [
  body('pickup.latitude')
    .isNumeric()
    .withMessage('Pickup latitude must be between -90 and 90'),
  
  body('pickup.longitude')
    .isNumeric()
    .withMessage('Pickup longitude must be between -180 and 180'),
  
  body('pickup.address')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Pickup address is required and must be less than 500 characters'),
  
  body('dropoff.latitude')
    .isNumeric()
    .withMessage('Dropoff latitude must be between -90 and 90'),
  
  body('dropoff.longitude')
    .isNumeric()
    .withMessage('Dropoff longitude must be between -180 and 180'),
  
  body('dropoff.address')
    .trim()
    .isLength({ min: 1})
    .withMessage('Dropoff address is required and must be less than 500 characters'),
  
  body('packageDetails.description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Package description is required and must be less than 200 characters'),
  
  body('packageDetails.weight')
    .optional()
    .isFloat({ min: 0.1, max: 50000 })
    .withMessage('Package weight must be between 0.1 and 50,000 kg'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  
  handleValidationErrors
];

// Location tracking validation
export const validateLocationUpdate = [
  body('location.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('status')
    .optional()
    .isIn(['moving', 'stopped', 'at_pickup', 'at_dropoff', 'idle'])
    .withMessage('Status must be moving, stopped, at_pickup, at_dropoff, or idle'),
  
  body('batteryLevel')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Battery level must be between 0 and 100'),
  
  handleValidationErrors
];
