class nginx {
   $numprocs = 1
   $logdir = "/var/log/nginx"

   package { 'nginx': ensure => installed, require => Exec['update'], }

   file { 'nginx':
      path    => '/etc/nginx/nginx.conf',
      ensure  => present,
      content => template("nginx/nginx.conf.erb"),
      require => Package['nginx'],
   }

   service { 'nginx':
      ensure     => running,
      enable     => true,
      hasrestart => true,
      require    => File['nginx'],
   }
}
