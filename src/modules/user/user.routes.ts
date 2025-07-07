import { Router } from "express";
import { userController } from "./user.controller";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import { userValidation } from "./user.validation";
import { strictLimiter } from "../../middleware/rate.limiter";
import Joi from "joi";

const router = Router();

// Public routes
router.post(
  "/login",
  strictLimiter,
  validate(userValidation.login),
  userController.login
);
router.post(
  "/register",
  validate(userValidation.create),
  userController.createUser
);

// Protected routes
router.use(authenticate); // All routes below require authentication

// Profile routes
router.get("/profile", userController.getProfile);
router.put(
  "/profile",
  validate({
    body: Joi.object({
      email: Joi.string().email(),
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50),
    }).min(1),
  }),
  userController.updateProfile
);

router.put(
  "/change-password",
  validate({
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required(),
    }),
  }),
  userController.changePassword
);

// User management routes (admin only)
router.get(
  "/",
  authorize("admin"),
  validate(userValidation.getUsers),
  userController.getUsers
);
router.get(
  "/:id",
  authorize("admin"),
  validate(userValidation.getById),
  userController.getUser
);
router.put(
  "/:id",
  authorize("admin"),
  validate(userValidation.update),
  userController.updateUser
);
router.delete(
  "/:id",
  authorize("admin"),
  validate(userValidation.getById),
  userController.deleteUser
);

export default router;
