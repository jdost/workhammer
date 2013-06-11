define nginx::vhost (
   $folder,
   $vhost = '',
   $port = "5000",
   $static_folder = "/s",
   $static_location = '',
) {
   if $static_location == '' {
      $static_location = $folder + "/static"
   }

   file { "nginx-${name}":
      path    => "/etc/nginx/conf.d/${name}.conf",
      ensure  => present,
      content => template("nginx/vhost.conf.erb"),
      require => Package['nginx'],
      notify  => Service['nginx'],
   }
}
