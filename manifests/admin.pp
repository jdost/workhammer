package { 'zsh':
   ensure      => present,
   before      => User['vagrant'],
}

user { 'vagrant':
   ensure      => present,
   shell       => '/bin/zsh',
   home        => '/home/vagrant',
   managehome  => true,
}

file { '/home/vagrant/.zshrc':
   ensure  => file,
   mode    => 644,
   require => User['vagrant'],
}

package { 'ncurses-term':
   ensure => present,
}
