import React from "react";
import PropTypes from "prop-types";

/**
 * Base Card Component
 * A versatile card container with consistent styling
 */
export const Card = ({ 
  children, 
  className = "", 
  padding = "default",
  hover = false,
  onClick,
  ...props 
}) => {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    default: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`
        bg-[#0d1f33]/80 backdrop-blur-xl 
        border border-white/10 
        rounded-2xl 
        shadow-xl
        ${paddingClasses[padding]}
        ${hover ? "hover:scale-[1.02] transition-all duration-300 cursor-pointer" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  padding: PropTypes.oneOf(["none", "sm", "default", "lg"]),
  hover: PropTypes.bool,
  onClick: PropTypes.func,
};

/**
 * Stats Card Component
 * Displays a statistic with icon, label, and value
 */
export const StatsCard = ({ 
  label, 
  value, 
  icon: Icon, 
  color = "blue",
  trend,
  trendValue,
  className = "",
  onClick,
}) => {
  const colorClasses = {
    blue: {
      gradient: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-500/30",
    },
    green: {
      gradient: "from-green-500 to-green-600",
      shadow: "shadow-green-500/30",
    },
    red: {
      gradient: "from-red-500 to-red-600",
      shadow: "shadow-red-500/30",
    },
    yellow: {
      gradient: "from-yellow-500 to-yellow-600",
      shadow: "shadow-yellow-500/30",
    },
    purple: {
      gradient: "from-purple-500 to-purple-600",
      shadow: "shadow-purple-500/30",
    },
    cyan: {
      gradient: "from-cyan-500 to-cyan-600",
      shadow: "shadow-cyan-500/30",
    },
    orange: {
      gradient: "from-orange-500 to-orange-600",
      shadow: "shadow-orange-500/30",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <Card hover={!!onClick} onClick={onClick} className={className}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-200/70 mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-white">
            {value}
          </p>
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs font-semibold ${
                trend === "up" ? "text-green-400" : "text-red-400"
              }`}>
                {trend === "up" ? "↑" : "↓"} {trendValue}
              </span>
              <span className="text-xs text-blue-200/50">vs last period</span>
            </div>
          )}
        </div>
        <div className={`
          w-14 h-14 
          bg-gradient-to-br ${colors.gradient}
          rounded-2xl 
          flex items-center justify-center 
          shadow-lg ${colors.shadow}
        `}>
          {Icon && <Icon className="text-white text-2xl" />}
        </div>
      </div>
    </Card>
  );
};

StatsCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  color: PropTypes.oneOf(["blue", "green", "red", "yellow", "purple", "cyan", "orange"]),
  trend: PropTypes.oneOf(["up", "down"]),
  trendValue: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

/**
 * Info Card Component
 * Displays informational content with optional icon and actions
 */
export const InfoCard = ({ 
  title, 
  description, 
  icon: Icon,
  variant = "default",
  children,
  actions,
  className = "",
}) => {
  const variantClasses = {
    default: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-200/90",
      iconBg: "bg-blue-500/20",
      iconText: "text-blue-400",
    },
    success: {
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      text: "text-green-200/90",
      iconBg: "bg-green-500/20",
      iconText: "text-green-400",
    },
    warning: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      text: "text-yellow-200/90",
      iconBg: "bg-yellow-500/20",
      iconText: "text-yellow-400",
    },
    danger: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-200/90",
      iconBg: "bg-red-500/20",
      iconText: "text-red-400",
    },
    info: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      text: "text-cyan-200/90",
      iconBg: "bg-cyan-500/20",
      iconText: "text-cyan-400",
    },
  };

  const styles = variantClasses[variant] || variantClasses.default;

  return (
    <div className={`
      ${styles.bg} 
      border ${styles.border} 
      rounded-xl 
      p-4
      ${className}
    `}>
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`
            w-10 h-10 
            ${styles.iconBg} 
            rounded-lg 
            flex items-center justify-center 
            flex-shrink-0
          `}>
            <Icon className={`${styles.iconText} text-lg`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-semibold text-white mb-1">
              {title}
            </h4>
          )}
          {description && (
            <p className={`text-sm ${styles.text} leading-relaxed`}>
              {description}
            </p>
          )}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

InfoCard.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.elementType,
  variant: PropTypes.oneOf(["default", "success", "warning", "danger", "info"]),
  children: PropTypes.node,
  actions: PropTypes.node,
  className: PropTypes.string,
};

/**
 * Feature Card Component
 * Displays a feature or service with icon, title, and description
 */
export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  onClick,
  className = "",
}) => {
  return (
    <Card 
      hover={!!onClick} 
      onClick={onClick}
      className={`group ${className}`}
    >
      <div className="text-center">
        {Icon && (
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
            <Icon className="text-white text-3xl" />
          </div>
        )}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-blue-200/70 leading-relaxed">
          {description}
        </p>
      </div>
    </Card>
  );
};

FeatureCard.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

/**
 * Metric Card Component
 * Displays a metric with label, value, and optional change indicator
 */
export const MetricCard = ({ 
  label, 
  value, 
  change,
  changeType = "neutral",
  suffix = "",
  prefix = "",
  className = "",
}) => {
  const changeColors = {
    positive: "text-green-400",
    negative: "text-red-400",
    neutral: "text-blue-400",
  };

  return (
    <Card padding="default" className={className}>
      <div>
        <p className="text-sm font-medium text-blue-200/70 mb-2">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          {prefix && (
            <span className="text-lg text-blue-200/70">{prefix}</span>
          )}
          <p className="text-2xl font-bold text-white">
            {value}
          </p>
          {suffix && (
            <span className="text-lg text-blue-200/70">{suffix}</span>
          )}
        </div>
        {change && (
          <p className={`text-sm font-semibold mt-2 ${changeColors[changeType]}`}>
            {change}
          </p>
        )}
      </div>
    </Card>
  );
};

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.string,
  changeType: PropTypes.oneOf(["positive", "negative", "neutral"]),
  suffix: PropTypes.string,
  prefix: PropTypes.string,
  className: PropTypes.string,
};