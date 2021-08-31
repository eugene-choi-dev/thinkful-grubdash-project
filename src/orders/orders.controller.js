const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order id ${orderId} does not exist`,
  });
}

function hasDeliverTo(req, res, next) {
  const { deliverTo } = req.body.data;

  if (!deliverTo || deliverTo === "") {
    next({
      status: 400,
      message: `Order must include a deliverTo`,
    });
  }
  next();
}

function hasMobileNumber(req, res, next) {
  const { mobileNumber } = req.body.data;

  if (!mobileNumber || mobileNumber === "") {
    next({
      status: 400,
      message: `Order must include a mobileNumber`,
    });
  }
  next();
}

function hasDishes(req, res, next) {
  const { dishes } = req.body.data;
  if (!dishes || !Array.isArray(dishes) || !dishes.length) {
    next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  next();
}

function hasQuantity(req, res, next) {
  const {
    data: { dishes },
  } = req.body;
  for (let dish of dishes) {
    if (
      !dish.quantity ||
      typeof dish.quantity !== "number" ||
      dish.quantity < 1
    ) {
      next({
        status: 400,
        message: `Dish ${dishes.indexOf(
          dish
        )} must have a quantity that is an integer greater than 0`,
      });
    }
  }
  next();
}

function idsMatch(req, res, next) {
  const orderId = req.params.orderId;
  const { id } = req.body.data;
  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }
  next();
}

function hasStatus(req, res, next) {
  const { status } = req.body.data;
  if (!status || status === "") {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  if (status !== "pending") {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  }
  next();
}

function isPending(req, res, next) {
  const { status } = res.locals.order;
  if (status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending,`,
    });
  }
  next();
}

function list(req, res) {
  res.json({ data: orders });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function create(req, res) {
  const {
    data: { deliverTo, status, mobileNumber, dishes },
  } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    status,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res, next) {
  const routeId = req.params.orderId;
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  const updatedOrder = {
    id: routeId,
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  res.json({ data: updatedOrder });
}

function destroy(req, res, next) {
  const foundOrder = res.locals.order;
  const index = orders.findIndex((order) => order.id === foundOrder.id);
  if (index > -1) {
    orders.splice(index, 1);
    res.sendStatus(204);
  }
}

module.exports = {
  create: [hasDeliverTo, hasMobileNumber, hasDishes, hasQuantity, create],
  read: [orderExists, read],
  update: [
    orderExists,
    hasDeliverTo,
    hasMobileNumber,
    hasDishes,
    hasQuantity,
    idsMatch,
    hasStatus,
    update,
  ],
  destroy: [orderExists, isPending, destroy],
  list,
};
